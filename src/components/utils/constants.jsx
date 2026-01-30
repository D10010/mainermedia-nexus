// Lead Statuses - Single Source of Truth
export const LEAD_STATUSES = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  meeting_set: 'Meeting Set',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost'
};

// Role Labels - Human Readable
export const ROLE_LABELS = {
  owner_admin: 'Owner',
  internal_user: 'Admin',
  external_user: 'External',
  sales_agent: 'Sales Agent'
};

// Status colors with green emphasis for qualified, meeting_set, proposal_sent, won
export const getStatusColor = (status) => {
  const colors = {
    new: 'bg-gray-500/20 text-gray-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    qualified: 'bg-green-500/20 text-green-400',
    meeting_set: 'bg-green-500/20 text-green-400',
    proposal_sent: 'bg-green-500/20 text-green-400',
    won: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};