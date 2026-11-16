
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { MarketingLayout } from '../layouts/MarketingLayout';

// Public Marketing Pages
import { HomePage } from '../pages/public/HomePage';
import { PricingPage } from '../pages/public/PricingPage';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Checkout } from '../pages/auth/Checkout';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TeamManagement } from '../pages/admin/TeamManagement';
import { CompanyDocuments } from '../pages/admin/CompanyDocuments';
import { PromptManagementPage } from '../pages/admin/PromptManagementPage';
import { CRMIntegration } from '../pages/admin/CRMIntegration';
import { CRMAutoFill } from '../pages/admin/CRMAutoFill';
import { GoogleDriveIntegration } from '../pages/admin/GoogleDriveIntegration';
import { BillingPage } from '../pages/admin/BillingPage';

// Shared Pages
import { PlatformTelemetryPage } from '../pages/superadmin/PlatformTelemetryPage';
import { MeetingLibrary } from '../pages/shared/MeetingLibrary';
import { MeetingReportPage } from '../pages/shared/MeetingReportPage';
import { DealsPage } from '../pages/shared/DealsPage';
import { DealWorkspacePage } from '../pages/shared/DealWorkspacePage';
import { CompanyIntelligencePage } from '../pages/shared/CompanyIntelligencePage';
import { AutomationsPage } from '../pages/shared/AutomationsPage';
import { KnowledgeBasePage } from '../pages/shared/KnowledgeBasePage';
import { PracticePage } from '../pages/shared/PracticePage';
import { MockMeetingsPage } from '../pages/shared/MockMeetingsPage';
import { LiveAssistPage } from '../pages/shared/LiveAssistPage';
import { AnalyticsPage } from '../pages/shared/AnalyticsPage';
import { AIChatPage } from '../pages/shared/AIChatPage';
import { SettingsPage } from '../pages/shared/SettingsPage';

// Manager Pages
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { AssignedRepsPage } from '../pages/manager/AssignedRepsPage';

// Sales Rep Pages
import { SalesDashboard } from '../pages/sales/SalesDashboard';

// Super Admin Pages
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';
import { TenantManagementPage } from '../pages/superadmin/TenantManagementPage';
import { PlatformPlansPage } from '../pages/superadmin/PlatformPlansPage';
import { PlatformIntegrationsPage } from '../pages/superadmin/PlatformIntegrationsPage';

import { useStore } from '../store/useStore';
import { DataGate } from '../components/common/DataGate';
import { ConnectSources } from '../pages/auth/ConnectSources';

export const AppRoutes: React.FC = () => {
  const { currentRole } = useStore();

  const getDefaultRedirect = () => {
    if (currentRole === 'super_admin') return '/platform/dashboard';
    if (currentRole === 'manager') return '/manager/dashboard';
    if (currentRole === 'sales_rep') return '/sales/dashboard';

    return '/admin/dashboard';
  };

  return (
    <Routes>

      {/* Public Marketing Routes */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Route>

      {/* Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* Post-login source connection (CRM / Google Drive) */}
      <Route path="/connect" element={<ConnectSources />} />

      {/* Legacy Redirects */}
      <Route
        path="/app/admin/*"
        element={<Navigate to="/admin" replace />}
      />

      <Route
        path="/app/manager/*"
        element={<Navigate to="/manager" replace />}
      />

      <Route
        path="/app/sales/*"
        element={<Navigate to="/sales" replace />}
      />

      <Route path="/app" element={<Navigate to="/" replace />} />

      {/* Client Admin Routes */}
      <Route path="/admin" element={<AppLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<DataGate keys={['team','meetings']} crmKeys={['deals']} title="Dashboard"><AdminDashboard /></DataGate>} />
        <Route path="team" element={<DataGate keys={['team']} title="Team"><TeamManagement /></DataGate>} />

        <Route path="crm" element={<CRMIntegration />} />
        <Route path="crm-autofill" element={<DataGate requiresCrm title="CRM Auto Fill"><CRMAutoFill /></DataGate>} />
        <Route path="drive" element={<GoogleDriveIntegration />} />

        <Route path="meetings" element={<DataGate keys={['meetings']} title="Meetings"><MeetingLibrary /></DataGate>} />
        <Route path="meetings/:meetingId" element={<DataGate keys={['meetings']} title="Meeting"><MeetingReportPage /></DataGate>} />
        <Route
          path="meeting-library"
          element={<Navigate to="/admin/meetings" replace />}
        />
        <Route
          path="meeting-library/:meetingId"
          element={<DataGate keys={['meetings']} title="Meeting"><MeetingReportPage /></DataGate>}
        />

        <Route path="leads" element={<DataGate keys={['deals','meetings']} title="Leads"><DealsPage /></DataGate>} />
        <Route path="leads/:dealId" element={<DataGate keys={['deals','meetings']} title="Lead"><DealWorkspacePage /></DataGate>} />

        <Route path="company-intelligence" element={<DataGate requiresCrm keys={['deals']} title="Company Intelligence"><CompanyIntelligencePage /></DataGate>} />
        <Route path="automations" element={<DataGate keys={['automations']} title="Automations"><AutomationsPage /></DataGate>} />
        <Route path="knowledge-base" element={<DataGate keys={['knowledge']} title="Knowledge Base"><KnowledgeBasePage /></DataGate>} />

        <Route path="company-docs" element={<DataGate keys={['documents']} title="Company Documents"><CompanyDocuments /></DataGate>} />
        <Route path="prompt-management" element={<PromptManagementPage />} />

        <Route path="practice" element={<PracticePage />} />
        <Route path="mock-meetings" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="mock-meetings/:mockId" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="live-assist" element={<LiveAssistPage />} />

        <Route path="analytics" element={<DataGate keys={['team','meetings','mockMeetings','billing']} crmKeys={['deals']} title="Analytics"><AnalyticsPage /></DataGate>} />
        <Route path="ai-chat" element={<AIChatPage />} />

        <Route path="billing" element={<DataGate keys={['billing']} title="Billing"><BillingPage /></DataGate>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Manager Routes */}
      <Route path="/manager" element={<AppLayout />}>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />

        <Route path="dashboard" element={<DataGate keys={['team','meetings']} crmKeys={['deals']} title="Dashboard"><ManagerDashboard /></DataGate>} />
        <Route path="team" element={<DataGate keys={['team']} title="Assigned Reps"><AssignedRepsPage /></DataGate>} />

        <Route path="leads" element={<DataGate keys={['deals','meetings']} title="Leads"><DealsPage /></DataGate>} />
        <Route path="leads/:dealId" element={<DataGate keys={['deals','meetings']} title="Lead"><DealWorkspacePage /></DataGate>} />

        <Route path="meetings" element={<DataGate keys={['meetings']} title="Meetings"><MeetingLibrary /></DataGate>} />
        <Route path="meetings/:meetingId" element={<DataGate keys={['meetings']} title="Meeting"><MeetingReportPage /></DataGate>} />
        <Route
          path="meeting-library"
          element={<Navigate to="/manager/meetings" replace />}
        />

        <Route path="company-intelligence" element={<DataGate requiresCrm keys={['deals']} title="Company Intelligence"><CompanyIntelligencePage /></DataGate>} />
        <Route path="analytics" element={<DataGate keys={['team','meetings','mockMeetings','billing']} crmKeys={['deals']} title="Analytics"><AnalyticsPage /></DataGate>} />

        <Route path="practice" element={<PracticePage />} />
        <Route path="mock-meetings" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="mock-meetings/:mockId" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="ai-chat" element={<AIChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Sales Representative Routes */}
      <Route path="/sales" element={<AppLayout />}>
        <Route index element={<Navigate to="/sales/dashboard" replace />} />

        <Route path="dashboard" element={<DataGate keys={['team','meetings']} crmKeys={['deals']} title="Dashboard"><SalesDashboard /></DataGate>} />

        <Route path="my-leads" element={<Navigate to="/sales/leads" replace />} />
        <Route path="leads" element={<DataGate keys={['deals','meetings']} title="Leads"><DealsPage /></DataGate>} />
        <Route path="leads/:dealId" element={<DataGate keys={['deals','meetings']} title="Lead"><DealWorkspacePage /></DataGate>} />

        <Route path="meetings" element={<DataGate keys={['meetings']} title="Meetings"><MeetingLibrary /></DataGate>} />
        <Route path="meetings/:meetingId" element={<DataGate keys={['meetings']} title="Meeting"><MeetingReportPage /></DataGate>} />
        <Route
          path="meeting-library"
          element={<Navigate to="/sales/meetings" replace />}
        />


        <Route path="practice" element={<PracticePage />} />
        <Route path="mock-meetings" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="mock-meetings/:mockId" element={<DataGate keys={['mockMeetings']} title="Mock Meetings"><MockMeetingsPage /></DataGate>} />
        <Route path="live-assist" element={<LiveAssistPage />} />

        <Route path="ai-chat" element={<AIChatPage />} />
        <Route path="analytics" element={<DataGate keys={['team','meetings','mockMeetings','billing']} crmKeys={['deals']} title="Analytics"><AnalyticsPage /></DataGate>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Super Admin Platform Routes */}
      <Route path="/platform" element={<AppLayout />}>
        <Route index element={<Navigate to="/platform/dashboard" replace />} />

        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="clients" element={<TenantManagementPage />} />
        <Route path="plans" element={<PlatformPlansPage />} />
        <Route path="integrations" element={<PlatformIntegrationsPage />} />
        <Route path="cues" element={<PromptManagementPage mode="platform" />} />

        <Route path="analytics" element={<PlatformTelemetryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={getDefaultRedirect()} replace />}
      />

    </Routes>
  );
};
