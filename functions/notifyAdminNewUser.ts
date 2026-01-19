import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true, message: 'Not a create event' });
    }

    const newUser = data;

    // Check if user has client or partner record
    const clients = await base44.asServiceRole.entities.Client.filter({ user_id: newUser.email });
    const partners = await base44.asServiceRole.entities.Partner.filter({ user_id: newUser.email });

    // If user has no role assignment, notify admins
    if (clients.length === 0 && partners.length === 0) {
      // Get all admin users
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

      // Create notification for each admin
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.email,
          title: 'New User Awaiting Role Assignment',
          message: `${newUser.full_name || newUser.email} has signed up and is waiting for role assignment.`,
          type: 'info',
          metadata: {
            user_email: newUser.email,
            user_name: newUser.full_name,
            action_required: 'role_assignment'
          }
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying admins:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});