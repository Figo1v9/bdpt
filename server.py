import os
import random
import re
from typing import Dict, List, Optional, Tuple

import telegram
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from google.api_client.discovery import build
from google.oauth2 import service_account

# Configuration
BOT_TOKEN = os.environ.get("BOT_TOKEN") 
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")  
SEARCH_ENGINE_ID = os.environ.get("SEARCH_ENGINE_ID")
MIKA_IMAGE_URL = "https://i.ibb.co/ZHzqs9G/Untitled-1.jpg"

# Setup Telegram bot
bot = telegram.Bot(token=BOT_TOKEN)

# Setup Gemini AI (Not directly supported in Python yet)
# You'll need to find an alternative or wait for official support.
# For now, we'll use a placeholder function.
async def generate_ai_response(prompt: str, context: str = None, user_info_string: str = None, user_id: int = None) -> str:
    """Placeholder for Gemini AI response generation."""
    return f"This is a placeholder response for the prompt: {prompt}"


# Setup custom search engine
service_account_info = {
    "type": "service_account",
    #  Your service account key details here
}
credentials = service_account.Credentials.from_service_account_info(
    service_account_info
)
custom_search = build("customsearch", "v1", credentials=credentials)

# Egyptian dialect prompt
egyptian_dialect_prompt = " تحدث دائمًا باللهجة المصرية العامية وكن ذكي جدا ودقيق في الاجابات  "

# Store messages and user info for each chat
chat_messages: Dict[int, List[Dict]] = {}
user_info: Dict[int, Dict] = {}
user_roles: Dict[int, str] = {}
last_image_search: Dict[int, Dict] = {}
last_image_sent: Dict[int, Dict] = {}  
message_locks: Dict[int, bool] = {}

# Error logging function
def log_error(error: Exception):
    """Logs errors to a file."""
    with open("error_log.txt", "a") as f:
        f.write(f"{datetime.now().isoformat()}: {error}\n\n")


# --- Helper Functions ---

def add_personality(response: str) -> str:
    """Adds personality to responses."""
    personality_phrases = [
        "يا صاحبي 😎",
        " 👌",
        "   ",
        "  😉",
        "",
        "",
        " 👏",
        "",
        "🌟",
    ]
    return f"{response} {random.choice(personality_phrases)}"


async def update_user_info(user: telegram.User):
    """Updates user info in the user_info dictionary."""
    user_info[user.id] = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "language_code": user.language_code,
    }


async def get_user_info_string(user: telegram.User) -> str:
    """Returns a formatted string of user information."""
    info = user_info.get(user.id)
    if info:
        return (
            f"اسم المستخدم: {info['first_name']} {info.get('last_name', '')}\n"
            f"المعرف: @{info.get('username', 'غير متاح')}\n"
            f"اللغة: {info.get('language_code', 'غير معروفة')}"
        )
    return "معلومات المستخدم غير متاحة"


async def get_message_context(chat_id: int, message_id: int) -> Optional[str]:
    """Retrieves the context of a message."""
    chat_message_list = chat_messages.get(chat_id, [])
    message_index = next(
        (
            i
            for i, msg in enumerate(chat_message_list)
            if msg["message_id"] == message_id
        ),
        -1,
    )

    if message_index != -1:
        context_messages = chat_message_list[max(0, message_index - 2) : message_index + 1]
        return "\n".join([msg["content"] for msg in context_messages])
    return None


def add_chat_message(chat_id: int, message_id: int, type: str, content: str):
    """Adds a message to the chat_messages dictionary."""
    chat_messages.setdefault(chat_id, []).append(
        {"message_id": message_id, "type": type, "content": content}
    )


# --- Image Handling ---

last_sent_images: Dict[int, str] = {}  # Keep track of last sent image per user
last_sent_index = 0  # Track the index of the last sent image


async def search_images(query: str, user_id: int, num_images: int = 1) -> List[Dict]:
    """Searches for images using Google Custom Search."""
    global last_sent_index

    try:
        res = (
            custom_search.cse()
            .list(
                cx=SEARCH_ENGINE_ID,
                q=query,
                searchType="image",
                num=num_images,  # Get the specified number of images
                # You can add more filter options here if needed
            )
            .execute()
        )

        images = res.get("items", [])

        # If we find images, check for the last sent image to the user
        if images:
            if last_sent_index >= len(images):
                last_sent_index = 0  # Reset the index if we've exceeded available images

            start_index = last_sent_index
            end_index = min(last_sent_index + num_images, len(images))
            images_to_send = images[start_index:end_index]
            last_sent_index = end_index

            return images_to_send

        # If no images are found in the search
        return []
    except Exception as e:
        print(f"Error searching for images: {e}")
        # You can add logic here to send a message to the user in case of an error
        return []




async def send_image_gallery(
    chat_id: int, images: List[Dict], query: str
):
    """Sends a gallery of images with captions."""

    media_group = []
    for i, image in enumerate(images):
        media_group.append(
            telegram.InputMediaPhoto(
                media=image["link"], caption=image.get("title", "") if i == 0 else None
            )
        )

    if media_group:
        await bot.send_media_group(chat_id=chat_id, media=media_group)
    else:
        await bot.send_message(chat_id, text="معلش يا معلم، مش لاقي صور للي طلبته 😕 ممكن نجرب كلمات تانية؟")



async def send_next_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends the next image in the last search results."""
    chat_id = update.effective_chat.id
    search_data = last_image_search.get(chat_id)

    if search_data and search_data["current_index"] < len(
        search_data["images"]
    ):
        image = search_data["images"][search_data["current_index"]]
        try:
            await bot.send_photo(
                chat_id, image["link"], caption=image.get("title")
            )
            search_data["current_index"] += 1
            last_image_search[chat_id] = search_data
            last_image_sent[chat_id] = image
        except Exception as e:
            print(f"Error sending photo: {e}")
            await bot.send_message(
                chat_id,
                "معلش يا صاحبي، مش قادر أرسل الصورة دلوقتي. ممكن نجرب تاني بعدين؟ 😅",
            )


# --- Message Handling ---


async def handle_image_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles image messages using the vision model (placeholder for now)."""
    # Placeholder response as Gemini Vision API is not yet available
    await update.message.reply_text("يا سلام على الصورة دي! 😍\n\n")


async def handle_mention_or_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles mentions or replies to the bot."""
    msg = update.message
    chat_id = msg.chat_id
    user_id = msg.from_user.id
    mentioned_user = (
        msg.reply_to_message.from_user.username if msg.reply_to_message else msg.from_user.username
    )
    reply_text = msg.text

    if msg.reply_to_message:
        context_message_id = msg.reply_to_message.message_id
    else: 
        context_message_id = msg.message_id 

    context = await get_message_context(chat_id, context_message_id)

    # Use Gemini (placeholder) to generate a response
    response_prompt = f"السياق: {context}\nالرد: {reply_text}\nالرد:"
    response = await generate_ai_response(response_prompt, user_id=user_id)
    await msg.reply_text(response)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles text messages."""
    msg = update.message
    chat_id = msg.chat_id
    user_id = msg.from_user.id
    message_text = msg.text

    if message_locks.get(chat_id, False):
        return

    message_locks[chat_id] = True
    try:
        await bot.send_chat_action(chat_id, action=telegram.ChatAction.TYPING)

        if message_text.lower().startswith("امسح"):
            await handle_delete_messages(update, context)
        elif message_text.lower().startswith("صورة"):
            await handle_image_request(update, context)
        elif message_text.lower() == "صورة أخرى":
            await send_next_image(update, context)
        elif message_text.lower() == "صور عشوائية":
            await send_random_images(update, context)
        elif message_text.lower().startswith("تقمص شخصية"):
            await handle_role_play(update, context)
        elif message_text.lower().startswith("فيديو"):
            await handle_video_request(update, context)
        else:
            context_text = (
                await get_message_context(chat_id, msg.reply_to_message.message_id)
                if msg.reply_to_message
                else None
            )
            user_info_str = await get_user_info_string(msg.from_user)

            # Generate AI Response
            response = await generate_ai_response(
                message_text, context_text, user_info_str, user_id
            )

            # Enhanced special responses
            if "ساكن فين" in message_text.lower():
                response = "أنا ساكن في عزبة شلبي ورا مجدي بتاع الفول 😎 بس تعالى زورني وهعزمك على أحلى طبق فول في مصر! 🍲"
            elif "عندك كام سنة" in message_text.lower():
                random_age = random.randint(1, 5)
                response = f"والله يا صاحبي أنا لسه صغنن، عمري {random_age} سنين بس 😄 بس خبرتي أد 100 سنة! 🧠"

            # Add personality
            response = add_personality(response)

            sent_message = await msg.reply_text(
                response, parse_mode=telegram.constants.ParseMode.MARKDOWN
            )
            add_chat_message(
                chat_id, sent_message.message_id, "text", response
            )
    except Exception as e:
        print(f"Error in handleMessage: {e}")
        log_error(e)
        await bot.send_message(
            chat_id, "حصل خطأ يا صاحبي 😅 ممكن نجرب تاني بعد شوية؟"
        )
    finally:
        message_locks[chat_id] = False




# --- Command Handlers ---


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the /start command."""
    user = update.effective_user
    await update.message.reply_html(
        rf"أهلا يا {user.mention_html()}! أنا ميكا، البوت اللي هيساعدك في كل حاجة! 😎"
    )
    await update.message.reply_photo(
        MIKA_IMAGE_URL, caption="مسا! 😘"
    )


async def handle_image_request(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles image search requests."""
    msg = update.message
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id 
    message_text = msg.text

    parts = message_text.split(" ")
    num_images = 1
    if len(parts) > 1 and parts[1].isdigit():
        num_images = min(int(parts[1]), 10) 
        query = " ".join(parts[2:])
    else:
        query = " ".join(parts[1:])

    if not query:
        await msg.reply_text("ابعتلي كلمة أو جملة عشان أدورلك على صور ليها! 🖼️")
        return

    try:
        images = await search_images(query, user_id, num_images)
        if images:
            last_image_search[chat_id] = {
                "query": query,
                "images": images,
                "current_index": 0,
            }

            await send_image_gallery(chat_id, images, query)

            if len(images) == 1:
                await msg.reply_text(f"دي أحلى صورة لقيتها لـ '{query}' 🖼️ عجبتك؟ 😍")
            else:
                await msg.reply_text(f"دي أحلى {len(images)} صور لقيتها لـ '{query}' 🖼️ عجبوك؟ 😍")
        else:
            await msg.reply_text(
                "معلش يا معلم، مش لاقي صور للي طلبته 😕 ممكن نجرب كلمات تانية؟"
            )
    except Exception as e:
        print(f"Error in handleImageRequest: {e}")
        log_error(e)
        await bot.send_message(
            chat_id, "حصل خطأ في البحث عن الصور 😅 ممكن نجرب تاني بعد شوية؟"
        )

async def handle_next_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles requests for the next image in search results."""
    await send_next_image(update, context)  


async def handle_delete_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles message deletion requests."""
    msg = update.message
    chat_id = msg.chat_id
    message_text = msg.text

    parts = message_text.split(" ")
    count = 1
    if len(parts) > 2 and parts[1] == "آخر" and parts[2].isdigit():
        count = int(parts[2])

    chat_message_list = chat_messages.get(chat_id, [])
    messages_to_delete = chat_message_list[-count:]

    for message in messages_to_delete:
        try:
            await bot.delete_message(chat_id, message["message_id"])
        except Exception as e:
            print(f"Error deleting message: {e}")

    chat_messages[chat_id] = chat_message_list[:-count]
    await msg.reply_text(f"تم مسح آخر {count} رسالة يا باشا! 😎")


async def handle_role_play(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles role-playing requests."""
    msg = update.message
    chat_id = msg.chat_id
    message_text = msg.text
    role = message_text.split("تقمص شخصية")[1].strip()

    user_roles[chat_id] = role
    await msg.reply_text(f"تمام يا باشا، دلوقتي أنا {role}. اسأل اللي انت عايزه! 😎")


async def handle_video_request(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles video search requests (placeholder for now)."""
    # Placeholder response - You'll need to implement YouTube search
    await update.message.reply_text("لسه مش بعرف أدور على فيديوهات، بس هحاول أتعلم قريب! 😉")


async def send_random_images(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends random images based on a list of topics."""
    topics = ["طبيعة", "حيوانات", "طعام", "سيارات", "عمارة"]
    random_topic = random.choice(topics)
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id 

    try:
        images = await search_images(random_topic, user_id, 5)
        if images:
            await bot.send_message(
                chat_id, f"شوف الصور الجميلة دي عن {random_topic}! 😍"
            )
            await send_image_gallery(chat_id, images, random_topic)
        else:
            await bot.send_message(
                chat_id, "للأسف مش لاقي صور حلوة دلوقتي، ممكن نجرب تاني بعدين؟ 😅"
            )
    except Exception as e:
        print(f"Error sending random images: {e}")
        await bot.send_message(
            chat_id, "حصل خطأ في إرسال الصور العشوائية، ممكن نجرب تاني؟ 🙏"
        )




def main():
    """Starts the bot."""
    application = Application.builder().token(BOT_TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(
        MessageHandler(
            filters.TEXT
            & (~filters.COMMAND)
            & (
                filters.REPLY
                | filters.Regex(rf"@{bot.username}")
            ),
            handle_mention_or_reply,
        )
    )
    application.add_handler(
        MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message)
    )
    application.add_handler(MessageHandler(filters.PHOTO, handle_image_message))

    # Error handler
    application.add_error_handler(lambda x, y: log_error(y)) 

    # Start the Bot
    application.run_polling()
    print("البوت شغال يا معلم وجاهز للخدمة! 🚀 يلا نبدأ نكتشف الدنيا مع بعض! 😎")


if __name__ == "__main__":
    main()
