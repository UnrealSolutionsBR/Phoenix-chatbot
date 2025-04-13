<?php
namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_Take_Control {

    public function __construct() {
        add_action('template_redirect', [$this, 'render_take_control']);
    }

    public function render_take_control() {
        if (!isset($_GET['phoenix_take_control'])) return;
        if (!current_user_can('manage_options')) wp_die('Acceso denegado');

        global $wpdb;
        $session_id = sanitize_text_field($_GET['phoenix_take_control']);
        $admin_name = wp_get_current_user()->display_name;
        $table = $wpdb->prefix . 'phoenix_history';

        // Insertar mensaje de entrada si no existe
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE session_id = %s AND sender = 'admin' AND message LIKE %s",
            $session_id,
            "%se unió al chat%"
        ));

        if (!$exists) {
            $wpdb->insert($table, [
                'session_id' => $session_id,
                'sender'     => 'admin',
                'message'    => "$admin_name se unió al chat",
                'created_at' => current_time('mysql')
            ]);
        }

        // Si el admin envió un mensaje
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_message'])) {
            $admin_message = sanitize_text_field($_POST['admin_message']);
            if (!empty($admin_message)) {
                $wpdb->insert($table, [
                    'session_id' => $session_id,
                    'sender'     => 'admin',
                    'message'    => $admin_message,
                    'created_at' => current_time('mysql')
                ]);
            }

            wp_redirect(add_query_arg('phoenix_take_control', $session_id, home_url()));
            exit;
        }

        // Obtener historial
        $messages = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE session_id = %s ORDER BY created_at ASC",
            $session_id
        ));

        // Renderizar
        $this->render_view($session_id, $admin_name, $messages);
        exit;
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
            <?php
            // Encolar el JS del polling
            wp_enqueue_script(
                'phoenix-admin-chat',
                PHOENIX_CHATBOT_URL . 'assets/js/admin-chat.js',
                [],
                filemtime(PHOENIX_CHATBOT_PATH . 'assets/js/admin-chat.js'),
                true
            );

            wp_localize_script('phoenix-admin-chat', 'phoenixAdminChat', [
                'ajaxurl'       => admin_url('admin-ajax.php'),
                'sessionId'     => $session_id,
                'lastTimestamp' => !empty($messages) ? strtotime(end($messages)->created_at) : 0,
            ]);

            wp_print_scripts('phoenix-admin-chat');
            ?>
        </head>
        <body>
        <div id="chat-box">
            <h2>Sesión: <?= esc_html($session_id) ?> <br><small>Administrador: <?= esc_html($admin_name) ?></small></h2>

            <div id="chat-messages">
                <?php foreach ($messages as $msg): ?>
                    <div class="message <?= esc_attr($msg->sender) ?>">
                        <strong><?= ucfirst(esc_html($msg->sender)) ?>:</strong> <?= esc_html($msg->message) ?>
                        <span class="timestamp"><?= date('Y-m-d H:i', strtotime($msg->created_at)) ?></span>
                    </div>
                <?php endforeach; ?>
            </div>

            <form id="chat-form" method="post">
                <input type="text" name="admin_message" placeholder="Escribe tu respuesta..." required>
                <button type="submit">Enviar</button>
            </form>
        </div>
        </body>
        </html>
        <?php
    }
}
