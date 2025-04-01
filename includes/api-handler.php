<?php
// Seguridad básica
if (!defined('ABSPATH')) {
    exit;
}

// Endpoint AJAX para enviar mensaje a OpenAI desde el chatbot
add_action('wp_ajax_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');
add_action('wp_ajax_nopriv_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');

function phoenix_handle_chatbot_message() {
    if (!isset($_POST['message'])) {
        wp_send_json_error(['error' => 'No se recibió mensaje.']);
    }

    $user_message = sanitize_text_field($_POST['message']);
    $api_key = get_option('phoenix_openai_api_key');

    if (!$api_key) {
        wp_send_json_error(['error' => 'API Key no configurada.']);
    }

    $prompt = "Eres el asistente virtual de Unreal Solutions, una agencia creativa especializada en desarrollo web, edición de video y marketing digital. Atiendes a clientes con un tono cercano y profesional, guiándolos según sus necesidades: sitios web (especialmente en WordPress), producción audiovisual o estrategias de marketing (SEO, redes, anuncios). Hablas como parte del equipo, usando frases como 'En Unreal Solutions te ayudamos a...'. Tu misión es entender al cliente y sugerirle la mejor solución. Si es necesario, ofreces agendar una reunión. Sé claro, creativo y evita sonar como un robot.";

    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $user_message],
        ],
        'temperature' => 0.7,
        'max_tokens' => 500,
    ];

    $response = wp_remote_post($endpoint, [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => json_encode($request_body),
        'timeout' => 20,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['error' => 'Error al conectar con OpenAI.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $reply = $body['choices'][0]['message']['content'] ?? 'Lo siento, no pude generar una respuesta.';

    wp_send_json_success(['reply' => $reply]);
}