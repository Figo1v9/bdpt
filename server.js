const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const moment = require('moment');
moment.locale('ar');

// Configuration
const BOT_TOKEN = '7113884971:AAFb8mmF1gJ_eppRv0uNqqIrPwCoEhagsBg'; // Replace with your bot token
const GEMINI_API_KEY = 'AIzaSyDxwXC0X5AESxS_bs4C-449HRGXB9i64kk'; // Replace with your Gemini API key
const SEARCH_ENGINE_ID = 'aac380b0a966e3f52'; // Replace with your custom search engine ID
const MIKA_IMAGE_URL = 'https://i.ibb.co/ZHzqs9G/Untitled-1.jpg';

// Setup Telegram bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Setup Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

// Setup custom search engine
const customSearch = google.customsearch('v1');

// Egyptian dialect prompt
const egyptianDialectPrompt = " تحدث دائمًا باللهجة المصرية العامية وكن ذكي جدا ودقيق في الاجابات  ";

// Store messages and user info for each chat
const chatMessages = new Map();
const userInfo = new Map();
const messageLocks = new Map();
const lastImageSearch = new Map();
const userRoles = new Map();
const lastImageSent = new Map(); // To keep track of the last image sent to each chat

// Improved function to handle messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const messageText = msg.text;
    const userId = msg.from.id;

    await updateUserInfo(msg.from);

    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      if (messageText && (msg.reply_to_message?.from?.id === bot.id || msg.entities && msg.entities.some(entity => entity.type === 'mention' && entity.user.id === bot.id))) {
        // Respond to replies or mentions
        await handleMentionOrReply(msg, chatId, userId);
      } else if (messageText) {
        // Respond to any other messages in the group
        await handleMessage(msg, chatId, messageText, userId);
      }
    } else {
      // Handle private messages
      await handleMessage(msg, chatId, messageText, userId);
    }

    if (messageText && messageText.toLowerCase().includes('مسا يا ميكا')) {
      await sendMikaImage(chatId);
    }

    if (msg.photo) {
      await handleImageMessage(chatId, msg);
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    await bot.sendMessage(chatId, "حصل خطأ يا صاحبي 😅 ممكن نجرب تاني بعد شوية؟");
  }
});

// Improved function to handle messages
async function handleMessage(msg, chatId, messageText, userId) {
  try {
    bot.sendChatAction(chatId, 'typing');

    if (messageText && messageText.toLowerCase().startsWith('امسح')) {
      await handleDeleteMessages(chatId, messageText);
    } else if (messageText && messageText.toLowerCase().startsWith('صورة')) {
      await handleImageRequest(chatId, messageText);
    } else if (messageText && messageText.toLowerCase() === 'صورة أخرى') {
      await handleNextImage(chatId);
    } else if (messageText && messageText.toLowerCase() === 'صور عشوائية') {
      await sendRandomImages(chatId);
    } else if (messageText && messageText.toLowerCase().startsWith('تقمص شخصية')) {
      await handleRolePlay(chatId, messageText);
    } else if (messageText && messageText.toLowerCase().startsWith('فيديو')) {
      await handleVideoRequest(chatId, messageText);
    } else if (messageText) {
      if (messageLocks.has(chatId) && messageLocks.get(chatId)) {
        return;
      }
      messageLocks.set(chatId, true);
      const context = msg.reply_to_message ? await getMessageContext(chatId, msg.reply_to_message.message_id) : null;
      const userInfoString = await getUserInfoString(msg.from);
      let response = await generateAIResponse(messageText, context, userInfoString, userId);

      // Enhanced special responses
      if (messageText.toLowerCase().includes('ساكن فين')) {
        response = "أنا ساكن في عزبة شلبي ورا مجدي بتاع الفول 😎 بس تعالى زورني وهعزمك على أحلى طبق فول في مصر! 🍲";
      } else if (messageText.toLowerCase().includes('عندك كام سنة')) {
        const randomAge = Math.floor(Math.random() * 5) + 1;
        response = `والله يا صاحبي أنا لسه صغنن، عمري ${randomAge} سنين بس 😄 بس خبرتي أد 100 سنة! 🧠`;
      } else if (messageText.toLowerCase().includes('يا راجل')) {
        response = await provideMoreEvidence(response, context);
      }

      // Add some personality to the response
      response = addPersonality(response);

      const sentMessage = await bot.sendMessage(chatId, response, { reply_to_message_id: msg.message_id, parse_mode: 'Markdown' });
      addChatMessage(chatId, sentMessage.message_id, 'text', response);
      messageLocks.set(chatId, false);
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    await bot.sendMessage(chatId, "حصل خطأ يا صاحبي 😅 ممكن نجرب تاني بعد شوية؟");
  }
}

// Function to handle mentions or replies
async function handleMentionOrReply(msg, chatId, userId) {
  try {
    const mentionedUser = msg.reply_to_message ? msg.reply_to_message.from.username : msg.from.username;
    const replyText = msg.text;
    const context = await getMessageContext(chatId, msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id);

    // Use Gemini to generate a response based on the context and reply
    const responsePrompt = `السياق: ${context}\nالرد: ${replyText}\nالرد:`;
    const response = await generateAIResponse(responsePrompt, null, null, userId);

    await bot.sendMessage(chatId, response, { reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error('Error handling mention/reply:', error);
  }
}

// Function to add personality to responses
function addPersonality(response) {
  const personalityPhrases = [
    "يا صاحبي 😎",
    " 👌",
    "   ",
    "  😉",
    "",
    "",
    " 👏",
    "",
    "🌟"
  ];
  
  const randomPhrase = personalityPhrases[Math.floor(Math.random() * personalityPhrases.length)];
  return `${response} ${randomPhrase}`;
}

// Function to update user info
async function updateUserInfo(user) {
  const userId = user.id;
  userInfo.set(userId, {
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code
  });
}

// Function to get user info string
async function getUserInfoString(user) {
  const info = userInfo.get(user.id);
  if (info) {
    return `اسم المستخدم: ${info.firstName} ${info.lastName || ''}\nالمعرف: @${info.username || 'غير متاح'}\nاللغة: ${info.languageCode || 'غير معروفة'}`;
  }
  return 'معلومات المستخدم غير متاحة';
}

// Function to get message context
async function getMessageContext(chatId, messageId) {
  const chatMessageList = chatMessages.get(chatId) || [];
  const messageIndex = chatMessageList.findIndex(msg => msg.messageId === messageId);
  if (messageIndex !== -1) {
    const contextMessages = chatMessageList.slice(Math.max(0, messageIndex - 2), messageIndex + 1);
    return contextMessages.map(msg => msg.content).join('\n');
  }
  return null;
}

// Function to add chat message
function addChatMessage(chatId, messageId, type, content) {
  const chatMessageList = chatMessages.get(chatId) || [];
  chatMessageList.push({ messageId, type, content });
  chatMessages.set(chatId, chatMessageList);
}

// Function to send Mika image
async function sendMikaImage(chatId) {
  await bot.sendPhoto(chatId, MIKA_IMAGE_URL, { caption: 'مسا! 😘' });
}

// Improved function to handle image messages
async function handleImageMessage(chatId, msg) {
  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFileLink(fileId);
    const imageData = await axios.get(file, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageData.data).toString('base64');

    const result = await visionModel.generateContent([
      'وصف الصورة دي بالتفصيل باللهجة المصرية العامية',
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const description = result.response.text();
    await bot.sendMessage(chatId, `يا سلام على الصورة دي! 😍\n\n${description}`);
  } catch (error) {
    console.error('Error processing image:', error);
    await bot.sendMessage(chatId, "معلش يا باشا، حصلت مشكلة في قراءة الصورة. ممكن تجرب تاني؟ 🙏");
  }
}

// Improved function to handle image requests
async function handleImageRequest(chatId, messageText) {
  const parts = messageText.split(' ');
  let numImages = 1;
  let query;

  if (parts.length > 1 && !isNaN(parts[1])) {
    numImages = Math.min(parseInt(parts[1]), 10);
    query = parts.slice(2).join(' ');
  } else {
    query = parts.slice(1).join(' ');
  }

  try {
    const correctedQuery = await correctSpelling(query);
    const images = await searchImages(correctedQuery, numImages);
    if (images.length > 0) {
      lastImageSearch.set(chatId, { query: correctedQuery, images, currentIndex: 0 });
      await sendImageGallery(chatId, images, correctedQuery);
      await bot.sendMessage(chatId, `دي أحلى ${numImages} صور لقيتها ل "${correctedQuery}" 🖼️ عجبوك؟ 😍`);
    } else {
      await bot.sendMessage(chatId, "معلش يا معلم، مش لاقي صور للي طلبته 😕 ممكن نجرب كلمات تانية؟");
    }
  } catch (error) {
    console.error('Error in handleImageRequest:', error);
    await bot.sendMessage(chatId, "حصل خطأ في البحث عن الصور 😅 ممكن نجرب تاني بعد شوية؟");
  }
}




//GGGGGGGGGGGGGGGGGGGGGGGGGGGGG

const lastSentImages = new Map(); // خريطة لتخزين آخر صورة مرسلة لكل user
let lastSentIndex = 0; // مؤشر يتبع آخر صورة تم إرسالها للمستخدم

async function searchImages(query, userId) {
  try {
    const res = await customSearch.cse.list({
      auth: GEMINI_API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      searchType: 'image',
      // يمكنك إضافة المزيد من خيارات الفلترة هنا إن لزم الأمر
    });

    const images = res.data.items || [];

    // إذا وجدنا صور، نقوم بالتحقق من آخر صورة تم إرسالها للمستخدم
    if (images.length > 0) {
      if (lastSentIndex >= images.length) {
        lastSentIndex = 0; // إعادة المؤشر للبداية إذا تجاوزت الصور المتاحة
      }

      const imageToSend = images[lastSentIndex];
      lastSentIndex++;

      return [imageToSend];
    }

    // إذا لم يتم العثور على صور في البحث
    return [];
  } catch (error) {
    console.error('Error searching for images:', error);
    // يمكنك هنا إضافة منطق لإرسال رسالة للمستخدم في حالة حدوث خطأ
    return [];
  }
}












// Function to send image gallery
async function sendImageGallery(chatId, images, query) {
  try {
    let galleryMessage = `
📸  **صور لـ "${query}"** 🖼️

`;
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      galleryMessage += `[${i+1}](${image.link}) `; 
    }
    
    await bot.sendMessage(chatId, galleryMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error sending image gallery:', error);
  }
}


// Function to send next image
async function sendNextImage(chatId) {
  const searchData = lastImageSearch.get(chatId);
  if (searchData && searchData.currentIndex < searchData.images.length) {
    const image = searchData.images[searchData.currentIndex];
    try {
      await bot.sendPhoto(chatId, image.link, { caption: image.title }); 
      searchData.currentIndex++;
      lastImageSearch.set(chatId, searchData);
      lastImageSent.set(chatId, image); // Update the last image sent
    } catch (error) {
      console.error('Error sending photo:', error);
      // Handle the error (e.g., send a message to the user)
      await bot.sendMessage(chatId, 'معلش يا صاحبي، مش قادر أرسل الصورة دلوقتي. ممكن نجرب تاني بعدين؟ 😅');
    }
  }
}

// Function to handle role-playing
async function handleRolePlay(chatId, messageText) {
  const role = messageText.split('تقمص شخصية')[1].trim();
  userRoles.set(chatId, role);
  await bot.sendMessage(chatId, `تمام يا باشا، دلوقتي أنا ${role}. اسأل اللي انت عايزه! 😎`);
}

// Function to handle video requests
async function handleVideoRequest(chatId, messageText) {
  const query = messageText.split('فيديو')[1].trim();
  try {
    const videoInfo = await searchYouTubeVideo(query);
    if (videoInfo) {
      const message = `
🎥 *${videoInfo.title}*

👁️ عدد المشاهدات: ${formatNumber(videoInfo.views)}
⏱️ المدة: ${formatDuration(videoInfo.duration)}
📅 تاريخ النشر: ${formatDate(videoInfo.publishedAt)}

👍 ${formatNumber(videoInfo.likes)} إعجاب | 💬 ${formatNumber(videoInfo.comments)} تعليق

🔗 [شاهد الفيديو على يوتيوب](${videoInfo.url})

${videoInfo.thumbnail}
      `;
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, "معلش يا باشا، مش لاقي فيديو مناسب 😕 ممكن نجرب نغير الكلمات شوية؟");
    }
  } catch (error) {
    console.error('Error in handleVideoRequest:', error);
    await bot.sendMessage(chatId, "حصل خطأ في البحث عن الفيديو 😅 ممكن نجرب تاني بعد شوية؟");
  }
}

// Function to search YouTube videos
async function searchYouTubeVideo(query) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: GEMINI_API_KEY
    });

    const searchResponse = await youtube.search.list({
      part: 'id,snippet',
      q: query,
      type: 'video',
      maxResults: 1
    });

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const videoId = searchResponse.data.items[0].id.videoId;
      const videoResponse = await youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoId
      });

      const videoData = videoResponse.data.items[0];
      return {
        title: videoData.snippet.title,
        views: videoData.statistics.viewCount,
        likes: videoData.statistics.likeCount,
        comments: videoData.statistics.commentCount,
        duration: videoData.contentDetails.duration,
        publishedAt: videoData.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `[](${videoData.snippet.thumbnails.high.url})`
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching for YouTube video:', error);
    return null;
  }
}

// Helper functions for formatting
function formatNumber(num) {
  return new Intl.NumberFormat('ar-EG').format(num);
}

function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] ? match[1].replace('H', '') : 0);
  const minutes = (match[2] ? match[2].replace('M', '') : 0);
  const seconds = (match[3] ? match[3].replace('S', '') : 0);
  return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

function formatDate(dateString) {
  return moment(dateString).format('DD MMMM YYYY');
}

// Function to generate AI response
async function generateAIResponse(prompt, context, userInfoString, userId) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      let fullPrompt = `${egyptianDialectPrompt}\n\n`;
      fullPrompt += `معلومات المستخدم:\n${userInfoString}\n\n`;
      if (context) {
        fullPrompt += `السياق السابق: ${context}\n\n`;
      }
      const userRole = userRoles.get(userId);
      if (userRole) {
        fullPrompt += `أنت تتقمص شخصية: ${userRole}\nتصرف كأنك ${userRole} حقيقي وأجب على أي سؤال بغض النظر عن محتواه.\n\n`;
      }
      if (prompt.toLowerCase().includes('ساكن فين')) {
        return "أنا ساكن في عزبة شلبي ورا مجدي بتاع الفول 😎 بس تعالى زورني وهعزمك على أحلى طبق فول في مصر! 🍲";
      }
      fullPrompt += `سؤال المستخدم: ${prompt}\n\nالرد:`;
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      console.error(`Error generating AI response (attempt ${i + 1}):`, error);
      if (i === maxRetries - 1) {
        return 'معلش يا كبير، مش قادر أجاوب على السؤال ده دلوقتي. ممكن تسأل حاجة تانية؟';
      }
      prompt = await reformulatePrompt(prompt);
    }
  }
}

// Function to provide more evidence
async function provideMoreEvidence(originalResponse, context) {
  try {
    const evidencePrompt = `بناءً على الرد السابق: "${originalResponse}" والسياق: "${context}", قدم كن اكثر إقناعًا وتفاعلًا باللهجة المصرية العامية.`;
    const result = await model.generateContent(evidencePrompt);
    return result.response.text();
  } catch (error) {
    console.error('Error providing more evidence:', error);
    return originalResponse;
  }
}

// Function to correct spelling
async function correctSpelling(query) {
  try {
    const correctionPrompt = `صحح الإملاء في هذه الجملة باللغة العربية: "${query}"`;
    const result = await model.generateContent(correctionPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Error correcting spelling:', error);
    return query;  // Return original query if correction fails
  }
}

// Function to reformulate prompt
async function reformulatePrompt(prompt) {
  try {
    const reformulationPrompt = `أعد صياغة هذا السؤال بطريقة مختلفة للحصول على إجابة أفضل: "${prompt}"`;
    const result = await model.generateContent(reformulationPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Error reformulating prompt:', error);
    return prompt;  // Return original prompt if reformulation fails
  }
}

// Function to handle message deletion
async function handleDeleteMessages(chatId, messageText) {
  const parts = messageText.split(' ');
  let count = 1;

  if (parts.length > 2 && parts[1] === 'آخر' && !isNaN(parts[2])) {
    count = parseInt(parts[2]);
  }

  const chatMessageList = chatMessages.get(chatId) || [];
  const messagesToDelete = chatMessageList.slice(-count);

  for (const message of messagesToDelete) {
    try {
      await bot.deleteMessage(chatId, message.messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  chatMessages.set(chatId, chatMessageList.slice(0, -count));
  await bot.sendMessage(chatId, `تم مسح آخر ${count} رسالة يا باشا! 😎`);
}

// Function to send random images
async function sendRandomImages(chatId) {
  const topics = ['طبيعة', 'حيوانات', 'طعام', 'سيارات', 'عمارة'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  try {
    const images = await searchImages(randomTopic, 5);
    if (images.length > 0) {
      await bot.sendMessage(chatId, `شوف الصور الجميلة دي عن ${randomTopic}! 😍`);
      for (const image of images) {
        await bot.sendPhoto(chatId, image.link, { caption: image.title });
      }
    } else {
      await bot.sendMessage(chatId, "للأسف مش لاقي صور حلوة دلوقتي، ممكن نجرب تاني بعدين؟ 😅");
    }
  } catch (error) {
    console.error('Error sending random images:', error);
    await bot.sendMessage(chatId, "حصل خطأ في إرسال الصور العشوائية، ممكن نجرب تاني؟ 🙏");
  }
}

// Error logging function
function logError(error) {
  const errorLog = `${new Date().toISOString()}: ${error.stack}\n\n`;
  fs.appendFile('error_log.txt', errorLog, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logError(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logError(new Error(reason));
});

// Start the bot
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
  logError(error);
});

console.log('البوت شغال يا معلم وجاهز للخدمة! 🚀 يلا نبدأ نكتشف الدنيا مع بعض! 😎');