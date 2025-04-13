// assets/js/admin-dashboard.js

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("phoenix-admin-dashboard-app");
    if (!container) return;
  
    container.innerHTML = `
      <div style="font-family: 'Open Sans', sans-serif; max-width: 1000px; margin: auto; padding: 20px;">
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 20px;">Chatbot history</h2>
        <div id="phoenix-chat-summary" style="margin-bottom: 20px;"></div>
        <table id="phoenix-chat-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f4; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Chat ID</th>
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Managed by</th>
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Created</th>
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Last message</th>
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Total messages</th>
              <th style="padding: 10px; border-bottom: 1px solid #ccc;">Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;
  
    fetch(`${PhoenixChatMonitorData.ajaxurl}?action=phoenix_get_sessions`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const tbody = document.querySelector("#phoenix-chat-table tbody");
          const summary = document.getElementById("phoenix-chat-summary");
          let total = res.data.length;
          let active = res.data.filter((s) => !s.trashed).length;
          let trash = total - active;
  
          summary.innerHTML = `
            <strong>All:</strong> ${total} | 
            <strong>Active:</strong> ${active} | 
            <strong>Trash:</strong> ${trash}
          `;
  
          res.data.forEach((session) => {
            const row = document.createElement("tr");
  
            row.innerHTML = `
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <a href="${window.location.origin}/wp-admin/admin.php?page=phoenix-admin-chat&session=${session.session_id}" style="color: #3C7EFF; text-decoration: none;">${session.session_id}</a>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${session.managed_by || "Phoenix"}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(session.created_at)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(session.last_message)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${session.total_messages}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <a href="${window.location.origin}/wp-admin/admin.php?page=phoenix-admin-chat&session=${session.session_id}" class="phoenix-view-link">Ver chat</a>
              </td>
            `;
  
            tbody.appendChild(row);
          });
        } else {
          container.innerHTML += `<p style="color: red;">No se encontraron sesiones activas.</p>`;
        }
      });
  
    function formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  });
  