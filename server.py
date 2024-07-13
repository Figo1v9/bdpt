import os
import logging
from telegram import Update, Bot, ParseMode
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
from googleapiclient.discovery import build
import requests
from bs4 import BeautifulSoup
import random
from datetime import datetime
from dateutil import parser

# Configuration
BOT_TOKEN = '7113884971:AAFb8mmF1gJ_eppRv0uNqqIrPwCoEhagsBg'  # Replace with your bot token
GEMINI_API_KEY = 'AIzaSyDxwXC0X5AESxS_bs4C-449HRGXB9i64kk'  # Replace with your Gemini API key
SEARCH_ENGINE_ID = 'aac380b0a966e3f52'  # Replace with your custom search engine ID
MIKA_IMAGE_URL = 'https://i.ibb.co/ZHzqs9G/Untitled-1.jpg'

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

# Setup custom search engine
service = build("customsearch", "v1", developerKey=GEMINI_API_KEY)

# Store messages and user info for each chat
chat_messages = {}
user_info = {}
message_locks = {}
last_image_search = {}
user_roles = {}
last_image_sent = {}


def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text('مرحبا! كيف يمكنني مساعدتك؟')


def handle_message(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    user_id = update.message.from_user.id
    message_text = update.message.text

    if chat_id not in chat_messages:
        chat_messages[chat_id] = []

    if chat_id not in message_locks:
        message_locks[chat_id] = False

    update_user_info(update.message.from_user)

    if update.message.chat.type in ['group', 'supergroup']:
        if update.message.reply_to_message and update.message.reply_to_message.from_user.id == context.bot.id:
            handle_mention_or_reply(update, context)
        else:
            handle_user_message(update, context)
    else:
        handle_user_message(update, context)

    if 'مسا يا ميكا' in message_text.lower():
        send_mika_image(update, context)

    if update.message.photo:
        handle_image_message(update, context)


def handle_user_message(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    message_text = update.message.text.lower()

    if message_locks[chat_id]:
        return

    message_locks[chat_id] = True

    if message_text.startswith('امسح'):
        handle_delete_messages(update, context)
    elif message_text.startswith('صورة'):
        handle_image_request(update, context)
    elif message_text == 'صورة أخرى':
        handle_next_image(update, context)
    elif message_text == 'صور عشوائية':
        send_random_images(update, context)
    elif message_text.startswith('تقمص شخصية'):
        handle_role_play(update, context)
    elif message_text.startswith('فيديو'):
        handle_video_request(update, context)
    else:
        handle_ai_response(update, context)

    message_locks[chat_id] = False


def handle_mention_or_reply(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    mentioned_user = update.message.reply_to_message.from_user.username if update.message.reply_to_message else update.message.from_user.username
    reply_text = update.message.text

    context_message = get_message_context(chat_id, update.message.reply_to_message.message_id if update.message.reply_to_message else update.message.message_id)
    response_prompt = f"السياق: {context_message}\nالرد: {reply_text}\nالرد:"
    response = generate_ai_response(response_prompt)

    update.message.reply_text(response, reply_to_message_id=update.message.message_id)


def handle_ai_response(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    message_text = update.message.text

    user_info_string = get_user_info_string(update.message.from_user)
    context_message = get_message_context(chat_id, update.message.reply_to_message.message_id if update.message.reply_to_message else None)
    user_role = user_roles.get(chat_id, '')

    prompt = f"{user_info_string}\nالسياق السابق: {context_message}\nأنت تتقمص شخصية: {user_role}\nسؤال المستخدم: {message_text}\n\nالرد:"

    response = generate_ai_response(prompt)
    response = add_personality(response)

    update.message.reply_text(response, parse_mode=ParseMode.MARKDOWN)


def handle_image_request(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    message_text = update.message.text.split()
    num_images = 1

    if len(message_text) > 1 and message_text[1].isdigit():
        num_images = min(int(message_text[1]), 10)
        query = ' '.join(message_text[2:])
    else:
        query = ' '.join(message_text[1:])

    query = correct_spelling(query)
    images = search_images(query, num_images)

    if images:
        last_image_search[chat_id] = {'query': query, 'images': images, 'current_index': 0}
        send_image_gallery(update, context, images, query)
    else:
        update.message.reply_text("معلش يا معلم، مش لاقي صور للي طلبته 😕 ممكن نجرب كلمات تانية؟")


def handle_next_image(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id

    if chat_id in last_image_search and last_image_search[chat_id]['current_index'] < len(last_image_search[chat_id]['images']):
        image = last_image_search[chat_id]['images'][last_image_search[chat_id]['current_index']]
        context.bot.send_photo(chat_id, image['link'], caption=image['title'])
        last_image_search[chat_id]['current_index'] += 1
    else:
        update.message.reply_text("مفيش صور تانية يا كبير، جرب اطلب حاجة جديدة!")


def send_image_gallery(update: Update, context: CallbackContext, images, query: str) -> None:
    chat_id = update.message.chat_id
    gallery_message = f"📸  **صور لـ \"{query}\"** 🖼️\n\n"
    for i, image in enumerate(images):
        gallery_message += f"[{i+1}]({image['link']}) "

    context.bot.send_message(chat_id, gallery_message, parse_mode=ParseMode.MARKDOWN)


def handle_image_message(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    file_id = update.message.photo[-1].file_id
    file = context.bot.get_file(file_id)
    image_data = requests.get(file.file_path).content

    response = generate_image_description(image_data)
    update.message.reply_text(f"يا سلام على الصورة دي! 😍\n\n{response}")


def handle_role_play(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    role = ' '.join(update.message.text.split()[2:])
    user_roles[chat_id] = role
    update.message.reply_text(f"تمام يا باشا، دلوقتي أنا {role}. اسأل اللي انت عايزه! 😎")


def handle_video_request(update: Update, context: CallbackContext) -> None:
    query = ' '.join(update.message.text.split()[1:])
    video_info = search_youtube_video(query)

    if video_info:
        message = f"""
🎥 *{video_info['title']}*

👁️ عدد المشاهدات: {video_info['views']}
⏱️ المدة: {format_duration(video_info['duration'])}
📅 تاريخ النشر: {format_date(video_info['publishedAt'])}

👍 {video_info['likes']} إعجاب | 💬 {video_info['comments']} تعليق

🔗 [شاهد الفيديو على يوتيوب]({video_info['url']})

{video_info['thumbnail']}
        """
        update.message.reply_text(message, parse_mode=ParseMode.MARKDOWN)
    else:
        update.message.reply_text("معلش يا باشا، مش لاقي فيديو مناسب 😕 ممكن نجرب نغير الكلمات شوية؟")


def handle_delete_messages(update: Update, context: CallbackContext) -> None:
    chat_id = update.message.chat_id
    message_text = update.message.text.split()
    count = 1

    if len(message_text) > 2 and message_text[1] == 'آخر' and message_text[2].isdigit():
        count = int(message_text[2])

    messages_to_delete = chat_messages[chat_id][-count:]
    for message in messages_to_delete:
        try:
            context.bot.delete_message(chat_id, message['message_id'])
        except Exception as e:
            logger.error(f"Error deleting message: {e}")

    chat_messages[chat_id] = chat_messages[chat_id][:-count]
    update.message.reply_text(f"تم مسح آخر {count} رسالة يا باشا! 😎")


def send_random_images(update: Update, context: CallbackContext) -> None:
    topics = ['طبيعة', 'حيوانات', 'طعام', 'سيارات', 'عمارة']
    random_topic = random.choice(topics)
    images = search_images(random_topic, 5)

    if images:
        update.message.reply_text(f"شوف الصور الجميلة دي عن {random_topic}! 😍")
        for image in images:
            context.bot.send_photo(update.message.chat_id, image['link'], caption=image['title'])
    else:
        update.message.reply_text("للأسف مش لاقي صور حلوة دلوقتي، ممكن نجرب تاني بعدين؟ 😅")


def send_mika_image(update: Update, context: CallbackContext) -> None:
    context.bot.send_photo(update.message.chat_id, MIKA_IMAGE_URL, caption='مسا! 😘')


def update_user_info(user) -> None:
    user_info[user.id] = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'language_code': user.language_code
    }


def get_user_info_string(user) -> str:
    info = user_info.get(user.id, {})
    return f"اسم المستخدم: {info.get('first_name', '')} {info.get('last_name', '')}\nالمعرف: @{info.get('username', 'غير متاح')}\nاللغة: {info.get('language_code', 'غير معروفة')}"


def get_message_context(chat_id, message_id) -> str:
    if chat_id not in chat_messages:
        return ""

    messages = chat_messages[chat_id]
    message_index = next((i for i, msg in enumerate(messages) if msg['message_id'] == message_id), -1)

    if message_index == -1:
        return ""

    context_messages = messages[max(0, message_index - 2):message_index + 1]
    return "\n".join(msg['content'] for msg in context_messages)


def generate_ai_response(prompt: str) -> str:
    # Dummy implementation for generating AI response. Replace with actual API call.
    # Implement your logic here using appropriate API or library.
    return f"Generated response for: {prompt}"


def generate_image_description(image_data) -> str:
    # Dummy implementation for generating image description. Replace with actual API call.
    # Implement your logic here using appropriate API or library.
    return "Description of the image."


def search_images(query: str, num_images: int) -> list:
    try:
        res = service.cse().list(
            q=query,
            cx=SEARCH_ENGINE_ID,
            searchType='image',
            num=num_images
        ).execute()

        return [{'link': item['link'], 'title': item['title']} for item in res.get('items', [])]
    except Exception as e:
        logger.error(f"Error searching for images: {e}")
        return []


def search_youtube_video(query: str) -> dict:
    # Dummy implementation for searching YouTube video. Replace with actual API call.
    # Implement your logic here using appropriate API or library.
    return {
        'title': 'Sample Video',
        'views': 1000,
        'likes': 100,
        'comments': 10,
        'duration': 'PT1M34S',
        'publishedAt': '2020-01-01T00:00:00Z',
        'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'thumbnail': ''
    }


def correct_spelling(query: str) -> str:
    # Dummy implementation for correcting spelling. Replace with actual API call.
    # Implement your logic here using appropriate API or library.
    return query


def add_personality(response: str) -> str:
    personality_phrases = [
        "يا صاحبي 😎",
        " 👌",
        " 😉",
        "",
        "",
        " 👏",
        "",
        "🌟"
    ]
    return response + random.choice(personality_phrases)


def format_duration(duration: str) -> str:
    duration_parsed = parser.parse(duration)
    return duration_parsed.strftime('%H:%M:%S')


def format_date(date_str: str) -> str:
    date_parsed = parser.parse(date_str)
    return date_parsed.strftime('%d %B %Y')


def main():
    updater = Updater(BOT_TOKEN)
    dispatcher = updater.dispatcher

    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))

    updater.start_polling()
    updater.idle()


if __name__ == '__main__':
    main()
