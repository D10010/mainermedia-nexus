import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Get all clients and partners
    const clients = await base44.asServiceRole.entities.Client.list();
    const partners = await base44.asServiceRole.entities.Partner.list();

    const clientUserIds = new Set(clients.map(c => c.user_id));
    const partnerUserIds = new Set(partners.map(p => p.user_id));

    // Find users without role assignment (not admin, not client, not partner)
    const unassignedUsers = allUsers.filter(user => 
      user.role !== 'admin' && 
      !clientUserIds.has(user.email) && 
      !partnerUserIds.has(user.email)
    );

    // Get existing notifications to avoid duplicates
    const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
      type: 'info'
    });

    const notifiedUserEmails = new Set(
      existingNotifications
        .filter(n => n.metadata?.action_required === 'role_assignment')
        .map(n => n.metadata?.user_email)
    );

    // Notify admins about new unassigned users
    if (unassignedUsers.length > 0) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

      for (const user of unassignedUsers) {
        // Skip if already notified
        if (notifiedUserEmails.has(user.email)) continue;

        for (const admin of admins) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: admin.email,
            title: 'New User Awaiting Role Assignment',
            message: `${user.full_name || user.email} has signed up and is waiting for role assignment.`,
            type: 'info',
            link: 'Notifications',
            metadata: {
              user_email: user.email,
              user_name: user.full_name,
              action_required: 'role_assignment'
            }
          });
        }
      }
    }

    return Response.json({ 
      success: true, 
      unassigned_count: unassignedUsers.length,
      newly_notified: unassignedUsers.filter(u => !notifiedUserEmails.has(u.email)).length
    });
  } catch (error) {
    console.error('Error checking unassigned users:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});