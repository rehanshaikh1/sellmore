import datetime as dt
import tempfile
import unittest
from pathlib import Path

import call_report as cr

UTC = dt.timezone.utc
TALK = ' '.join(['word'] * 40)


class ParseName(unittest.TestCase):
    def test_outbound_with_offset(self):
        p = cr.parse_name('2026-09-18 14 11 07 +0100 8001 441614573357.txt')
        self.assertEqual(p['number'], '1614573357')
        self.assertEqual(p['started'], dt.datetime(2026, 9, 18, 13, 11, 7, tzinfo=UTC))
        self.assertFalse(p['variant'])

    def test_inbound_uses_caller(self):
        p = cr.parse_name('2026-09-18 14 11 07 +0100 +447787420250 442477350151.txt')
        self.assertEqual(p['number'], '7787420250')

    def test_underscore_time_no_offset_is_uk_time(self):
        p = cr.parse_name('2026-05-14 14_26_07 8004 443300561980.txt')
        self.assertEqual(p['started'], dt.datetime(2026, 5, 14, 13, 26, 7, tzinfo=UTC))  # BST
        p = cr.parse_name('2026-11-14 14_26_07 8004 443300561980.txt')
        self.assertEqual(p['started'], dt.datetime(2026, 11, 14, 14, 26, 7, tzinfo=UTC))  # GMT

    def test_variant_and_internal_and_junk(self):
        self.assertTrue(cr.parse_name('2026-06-10 10 01 15 +0100 8001 442476362032-DESKTOP-16T57VN.txt')['variant'])
        self.assertIsNone(cr.parse_name('2026-06-04 13 42 26 +0100 8006 8001.txt'))
        self.assertIsNone(cr.parse_name('_sync-log.txt'))


class FindTranscripts(unittest.TestCase):
    def test_prefers_plain_file_and_respects_since(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d, 'Keerthy')
            folder.mkdir()
            for name in ['2026-10-28 22 17 54 +0000 8001 447424405482.txt',
                         '2026-10-28 22 17 54 +0000 8001 447424405482-DESKTOP-16T57VN.txt',
                         '2026-09-01 10 00 00 +0100 8001 441773522300.txt']:
                Path(folder, name).write_text(TALK)
            items = cr.find_transcripts(d, dt.datetime(2026, 10, 1, tzinfo=UTC))
            self.assertEqual([p.name for p, _ in items], ['2026-10-28 22 17 54 +0000 8001 447424405482.txt'])


class TidySummary(unittest.TestCase):
    def test_orders_lines_and_strips_markdown(self):
        raw = ('Here you go:\n**Reason:** price check\n- Discussed: 50 brackets, £4 each\n'
               'Next step: send quote Friday\nFollow-up needed: Yes')
        self.assertEqual(cr.tidy_summary(raw), 'Reason: price check\nDiscussed: 50 brackets, £4 each\n'
                         'Concerns: Not mentioned\nNext step: send quote Friday\nFollow-up needed: Yes')

    def test_falls_back_to_raw(self):
        self.assertEqual(cr.tidy_summary('  just a sentence  '), 'just a sentence')


class FakeSf:
    def __init__(self, task):
        self.task, self.updates = task, []

    def find_task(self, number, started):
        return self.task

    def add_summary(self, task, summary, today):
        self.updates.append((task['Id'], summary))


class Process(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.path = Path(self.dir.name, '2026-10-28 22 17 54 +0000 8001 447424405482.txt')
        self.path.write_text(TALK)
        self.items = [(self.path, cr.parse_name(self.path.name))]
        self.now = dt.datetime(2026, 10, 28, 23, 0, tzinfo=UTC)

    def tearDown(self):
        self.dir.cleanup()

    def test_summarises_once(self):
        sf, state = FakeSf({'Id': 'T1', 'Description': 'Logged automatically'}), {}
        counts = cr.process(self.items, sf, state, lambda t: 'Reason: x', self.now, log=lambda *_: None)
        self.assertEqual(counts, {'summarised': 1})
        self.assertEqual(sf.updates, [('T1', 'Reason: x')])
        counts = cr.process(self.items, sf, state, lambda t: 'Reason: x', self.now, log=lambda *_: None)
        self.assertEqual(counts, {})  # already in state

    def test_waits_for_task_then_gives_up(self):
        state = {}
        self.assertEqual(cr.process(self.items, FakeSf(None), state, None, self.now), {'waiting': 1})
        self.assertEqual(state, {})
        later = self.now + dt.timedelta(days=3)
        self.assertEqual(cr.process(self.items, FakeSf(None), state, None, later), {'no task': 1})

    def test_skips_short_and_already_summarised(self):
        self.path.write_text('Thank you for calling')
        self.assertEqual(cr.process(self.items, FakeSf(None), {}, None, self.now), {'too short': 1})
        self.path.write_text(TALK)
        sf = FakeSf({'Id': 'T1', 'Description': 'CALL SUMMARY (automatic)\n...'})
        self.assertEqual(cr.process(self.items, sf, {}, None, self.now), {'already summarised': 1})

    def test_dry_run_writes_nothing(self):
        sf, state, out = FakeSf({'Id': 'T1'}), {}, []
        counts = cr.process(self.items, sf, state, lambda t: 'Reason: x', self.now, dry_run=True, log=out.append)
        self.assertEqual(counts, {'previewed': 1})
        self.assertEqual((sf.updates, state), ([], {}))
        self.assertIn('T1', out[0])


class SalesforceClient(unittest.TestCase):
    def test_find_task_picks_nearest_and_builds_query(self):
        calls = []

        def request(url, data=None, headers=None, method=None, timeout=60):
            calls.append(url)
            if url.endswith('/oauth2/token'):
                return {'access_token': 'tok', 'instance_url': 'https://x.my.salesforce.com'}
            return {'records': [{'Id': 'FAR', 'Call_Started__c': '2026-10-28T22:19:30.000+0000'},
                                {'Id': 'NEAR', 'Call_Started__c': '2026-10-28T22:17:55.000+0000'}]}

        sf = cr.Salesforce('https://login', 'id', 'secret', request=request)
        task = sf.find_task('+447424405482', dt.datetime(2026, 10, 28, 22, 17, 54, tzinfo=UTC))
        self.assertEqual(task['Id'], 'NEAR')
        # The logger stores the national number (lib/phone.js nationalNumber), so the query must too.
        self.assertIn("Call_Number__c%20%3D%20%277424405482%27", calls[1])
        self.assertIn('2026-10-28T22%3A15%3A54Z', calls[1])


if __name__ == '__main__':
    unittest.main()
