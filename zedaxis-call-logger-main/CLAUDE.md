# zedaxis-call-logger — CallSwitch One → Salesforce call logging (Render fleet, service: zedaxis-call-logger)

**STOP — before modifying this app, deploying, or creating any new Render app,
read the standard backup policy first:**
`%USERPROFILE%\We Design\Zedaxis AI Hub - Documents\05. Platforms\BACKUP-POLICY.md`

Summary: an automated backup zip of every Render service runs **every Saturday
at 12:00 noon on ZA-SV-0001** (the main server — backups run nowhere else). The
**3 latest versions** are kept in `05. Platforms\zedaxis-call-logger\Backups\` for
rollback. Backups capture the GitHub repo (zedaxis2018), NOT uncommitted local
work — so **commit and push before any significant change**.

## What this app is

Built 2026-10-28 because the native CallSwitch One Salesforce package (Pulse HD
ECA Integration) syncs the phone book but did not log any calls. CallSwitch One
(Yappl portal, Voice › Calls › Web Hooks) posts four hooks per call — new,
answered, ended, voicemail — to `/hook/<event>`. On "ended" (+15 s to catch a
late voicemail hook) the app finds the outside number in Salesforce (Contact,
then open Lead, then Account, via SOSL on the national digits) and creates one
completed call Task (TaskSubtype Call, CallType, CallDurationInSeconds,
CallDisposition, CallObject = CallSwitch uuid for de-duplication). Owner = the
rep on the extension (EXT_USERS), else the record owner, else DEFAULT_OWNER_ID.
Numbers with no Salesforce match and internal calls are skipped.

- No data of its own: in-progress calls live in memory only (a restart mid-call
  loses that one call). The repo zip is its whole backup.
- Salesforce auth: OAuth client-credentials via the External Client App
  "Zedaxis Call Logger" (run-as user Yash). Secrets only in Render env vars.
- CallSwitch hooks carry no duration or recording link; duration is timed from
  hook arrival, and the recording stays in the CallSwitch portal.
- `GET /status?token=<WEBHOOK_TOKEN>` shows the last 50 outcomes.
- Each Task also gets `Call_Number__c` (national digits) and `Call_Started__c`
  (UTC) so recordings can be matched to it; metadata + the "Call Logger Fields"
  permission set are in `salesforce/` (deploy with
  `sf project deploy start --metadata-dir salesforce`). If the fields are
  missing the logger drops them and still logs the call.
- `report/call_report.py` (Python, stdlib only) runs on ZA-SV-0001, not Render:
  turns each new call transcript in Google Drive into a five-line summary with
  a local Ollama model and prepends it to the matching Task's Description.
  Install/operation brief: `05. Platforms\zedaxis-call-logger\SERVER-BRIEF-call-reports.md`.
  Tests: `cd report && python -m unittest test_call_report`.
- Local: `npm test`; `node server.js` needs the env vars in render.yaml.
