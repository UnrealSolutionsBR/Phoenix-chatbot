<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Phoenix_History {

    public function __construct() {
        add_action('wp_ajax_phoenix_save_message', [ $this, 'save_message' ]);
        add_action('wp_ajax_nopriv_phoenix_save_message', [ $this, 'save_message' ]);

        add_action('wp_ajax_phoenix_get_messages', [ $this, 'get_messages' ]);
        add_action('wp_ajax_nopriv_phoenix_get_messages', [ $this, 'get_messages' ]);

        add_action('wp_ajax_phoenix_get_sessions', [ $this, 'get_sessions' ]);
    }

    /**
     * Guarda un mensaje en la base de datos.
     */
    public function save_message() {
        global $wpdb;

        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $sender     = sanitize_text_field($_POST['sender'] ?? '');
        $message    = sanitize_textarea_field($_POST['message'] ?? '');

        if (empty($session_id) || empty($sender) || empty($message)) {
            wp_send_json_error(['message' => 'Faltan datos requeridos']);
        }

        $table = $wpdb->prefix . 'phoenix_history';
        $wpdb->insert($table, [
            'session_id' => $session_id,
            'sender'     => $sender,
            'message'    => $message,
            'created_at' => current_time('mysql')
        ]);

        wp_send_json_success(['id' => $wpdb->insert_id]);
    }

    /**
     * Devuelve los mensajes por session_id
     * Si se pasa ?after=YYYY-MM-DD HH:MM:SS devuelve solo los nuevos
     */
    public function get_messages() {
        global $wpdb;

        $session_id = sanitize_text_field($_GET['session_id'] ?? '');
        $after      = sanitize_text_field($_GET['after'] ?? '');

        if (empty($session_id)) {
            wp_send_json_error(['message' => 'Session ID requerido']);
        }

        $table = $wpdb->prefix . 'phoenix_history';

        // Consulta básica
        $sql = "SELECT id, sender, message, created_at 
                FROM $table 
                WHERE session_id = %s";

        // Filtro por timestamp si está presente
        if (!empty($after)) {
            $sql .= " AND created_at > %s";
            $query = $wpdb->prepare($sql . " ORDER BY created_at ASC", $session_id, $after);
        } else {
            $query = $wpdb->prepare($sql . " ORDER BY created_at ASC", $session_id);
        }

        $messages = $wpdb->get_results($query, ARRAY_A);
        wp_send_json_success($messages);
    }

    /**
     * Devuelve las sesiones únicas activas ordenadas por última actividad
     */
    public function get_sessions() {
        global $wpdb;

        $table = $wpdb->prefix . 'phoenix_history';
        $results = $wpdb->get_results("
            SELECT session_id, MAX(created_at) as last_activity
            FROM $table
            GROUP BY session_id
            ORDER BY last_activity DESC
            LIMIT 50
        ", ARRAY_A);

        wp_send_json_success($results);
    }
}
