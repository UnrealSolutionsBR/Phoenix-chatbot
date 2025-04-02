<?php
// Seguridad básica
if (!defined('ABSPATH')) {
    exit;
}

// Acción principal del chatbot (respuesta general GPT)
add_action('wp_ajax_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');
add_action('wp_ajax_nopriv_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');

function phoenix_handle_chatbot_message() {
    if (!isset($_POST['history'])) {
        wp_send_json_error(['error' => 'No se recibió historial.']);
    }

    $history = json_decode(stripslashes($_POST['history']), true);
    $api_key = get_option('phoenix_openai_api_key');

    if (!$api_key || empty($history)) {
        wp_send_json_error(['error' => 'Falta API Key o historial.']);
    }

    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-4o',
        'messages' => $history,
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

// Acción para generar frases por intención
add_action('wp_ajax_phoenix_generate_flow_message', 'phoenix_generate_flow_message');
add_action('wp_ajax_nopriv_phoenix_generate_flow_message', 'phoenix_generate_flow_message');

function phoenix_generate_flow_message() {
    if (!isset($_POST['intent'])) {
        wp_send_json_error(['error' => 'Falta la intención.']);
    }

    $intent = sanitize_text_field($_POST['intent']);
    $history = isset($_POST['history']) ? json_decode(stripslashes($_POST['history']), true) : [];
    $user_data = isset($_POST['user_data']) ? json_decode(stripslashes($_POST['user_data']), true) : [];

    $api_key = get_option('phoenix_openai_api_key');
    if (!$api_key) {
        wp_send_json_error(['error' => 'API Key no configurada.']);
    }

    // Prompt base
    $prompt = "Eres el asistente virtual de Unreal Solutions. Estás guiando al usuario paso a paso. Genera una pregunta clara, amigable y breve según la intención: '{$intent}'. No incluyas instrucciones técnicas. Usa un estilo conversacional.";

    // Añadir contexto según la intención
    if ($intent === 'pedir_nombre') {
        $prompt .= " Pregunta al usuario cómo se llama.";
    } elseif ($intent === 'pedir_email') {
        $name = $user_data['name'] ?? 'amigo';
        $prompt .= " Agradécele por su nombre ({$name}) y pídele su correo electrónico.";
    } elseif ($intent === 'pedir_telefono') {
        $prompt .= " Ahora pídele su número de teléfono, aclarando que solo se usará para contactarlo por WhatsApp si es necesario.";
    }

    $messages = [
        ['role' => 'system', 'content' => $prompt]
    ];

    // También incluir últimos mensajes como contexto, opcional
    $messages = array_merge($messages, array_slice($history, -5));

    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-4o',
        'messages' => $messages,
        'temperature' => 0.6,
        'max_tokens' => 250,
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
        wp_send_json_error(['error' => 'Error al generar la pregunta.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $reply = $body['choices'][0]['message']['content'] ?? 'Lo siento, no pude generar la pregunta.';

    wp_send_json_success(['reply' => $reply]);
}
