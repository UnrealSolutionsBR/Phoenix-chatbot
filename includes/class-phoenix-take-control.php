<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Take_Control {

    public function __construct() {
        add_action('template_redirect', [$this, 'render_take_control']);
        add_action('wp_ajax_phoenix_send_admin_message', [$this, 'send_admin_message']);
        add_action('wp_ajax_phoenix_poll_messages', [$this, 'poll_messages']);
        add_action('wp_ajax_phoenix_admin_left_chat', [$this, 'handle_admin_left']);
    }

    public function handle_admin_left() {
        $session_id = sanitize_text_field($_POST['session_id']);
        $admin_name = wp_get_current_user()->display_name;
    
        if ($session_id && $admin_name) {
            global $wpdb;
            $wpdb->insert("{$wpdb->prefix}phoenix_history", [
                'session_id' => $session_id,
                'sender'     => 'admin',
                'message'    => "Admin: {$admin_name} salió del chat",
                'created_at' => current_time('mysql', 1)
            ]);
    
            wp_send_json_success();
        }
    
        wp_send_json_error();
    }

    public function render_take_control() {
        if (!isset($_GET['phoenix_take_control'])) return;
        if (!current_user_can('manage_options')) wp_die('Acceso denegado');

        global $wpdb;
        $session_id = sanitize_text_field($_GET['phoenix_take_control']);
        $admin_name = wp_get_current_user()->display_name;
        $table = $wpdb->prefix . 'phoenix_history';

        // Insertar mensaje de entrada si es la primera vez
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE session_id = %s AND sender = 'admin'",
            $session_id
        ));

        if (!$exists) {
            $wpdb->insert($table, [
                'session_id' => $session_id,
                'sender'     => 'admin',
                'message'    => "$admin_name entró al chat",
                'created_at' => current_time('mysql')
            ]);
        }

        // Cargar historial
        $messages = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE session_id = %s ORDER BY id ASC",
            $session_id
        ));

        // Renderizar la vista
        $this->render_view($session_id, $admin_name, $messages);
        exit;
    }

    public function send_admin_message() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['error' => 'Unauthorized']);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $message    = sanitize_text_field($_POST['message'] ?? '');

        if (empty($session_id) || empty($message)) {
            wp_send_json_error(['error' => 'Missing fields']);
        }

        $wpdb->insert($table, [
            'session_id' => $session_id,
            'sender'     => 'admin',
            'message'    => $message,
            'created_at' => current_time('mysql')
        ]);

        if ($wpdb->last_error) {
            wp_send_json_error(['error' => $wpdb->last_error]);
        }

        wp_send_json_success([
            'id'         => $wpdb->insert_id,
            'message'    => $message,
            'created_at' => current_time('mysql'),
            'sender'     => 'admin'
        ]);
    }

    public function poll_messages() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['error' => 'Unauthorized']);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'phoenix_history';

        $session_id = sanitize_text_field($_GET['session_id'] ?? '');
        $last_id    = intval($_GET['after_id'] ?? 0);

        if (empty($session_id)) {
            wp_send_json_error(['error' => 'Missing session ID']);
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE session_id = %s AND id > %d ORDER BY id ASC",
            $session_id,
            $last_id
        ));

        wp_send_json_success($results);
    }

    private function render_view($session_id, $admin_name, $messages) {
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Chat control</title>
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Open Sans', sans-serif;
                    background: #f4f4f4;
                    padding: 30px;
                    color: #222;
                }
                h2 {
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                #chat-box {
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 700px;
                    margin: auto;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                #chat-messages {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                    padding-right: 10px;
                }
                .message {
                    margin-bottom: 12px;
                    font-size: 15px;
                    line-height: 1.5;
                }
                .message.user {
                    color: #3C7EFF;
                }
                .message.bot {
                    color: #555;
                }
                .message.admin {
                    color: #27ae60;
                    font-weight: bold;
                }
                .message .timestamp {
                    font-size: 11px;
                    color: #999;
                    display: block;
                }
                #chat-form {
                    display: flex;
                    gap: 10px;
                }
                #chat-form input[type="text"] {
                    flex: 1;
                    padding: 12px;
                    font-size: 15px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                #chat-form button {
                    padding: 12px 20px;
                    background: #3C7EFF;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-weight: 600;
                    cursor: pointer;
                }
                #chat-form button:hover {
                    background: #2c5fcc;
                }
            </style>
            <script>
                const phoenixTakeControl = {
                    ajaxurl: "<?= admin_url('admin-ajax.php') ?>",
                    sessionId: "<?= esc_js($session_id) ?>"
                };
            </script>
            <script src="<?= PHOENIX_CHATBOT_URL . 'assets/js/take-control.js' ?>?ver=<?= time() ?>"></script>
        </head>
        <body>
        <div id="chat-box">
            <h2>Sesión: <?= esc_html($session_id) ?> <br><small>Administrador: <?= esc_html($admin_name) ?></small></h2>

            <div id="chat-messages">
                <?php foreach ($messages as $msg): ?>
                    <div class="message <?= esc_attr($msg->sender) ?>" data-id="<?= esc_attr($msg->id) ?>">
                        <strong><?= ucfirst(esc_html($msg->sender)) ?>:</strong> <?= esc_html($msg->message) ?>
                        <span class="timestamp"><?= date('Y-m-d H:i', strtotime($msg->created_at)) ?></span>
                    </div>
                <?php endforeach; ?>
            </div>

            <form id="chat-form">
                <input type="text" id="admin_message_input" placeholder="Escribe tu respuesta..." required>
                <button type="submit">Enviar</button>
            </form>
        </div>
        </body>
        </html>
        <?php
    }
}
