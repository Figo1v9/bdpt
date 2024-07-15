const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const ytdl = require('ytdl-core');
const cheerio = require('cheerio');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const wikipedia = require('wikipedia');
moment.locale('ar');

// Configuration
const BOT_TOKEN = '7113884971:AAFb8mmF1gJ_eppRv0uNqqIrPwCoEhagsBg';
const GEMINI_API_KEY = 'AIzaSyDxwXC0X5AESxS_bs4C-449HRGXB9i64kk';
const SEARCH_ENGINE_ID = 'aac380b0a966e3f52';
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
const egyptianDialectPrompt = "تحدث دائمًا باللهجة المصرية العامية وكن ذكي جدا ودقيق في الاجابات";

// Store messages and user info for each chat
const chatMessages = new Map();
const userInfo = new Map();
const messageLocks = new Map();
const lastImageSearch = new Map();
const userRoles = new Map();
const lastImageSent = new Map();
const imageSearchIndex = new Map();

// Main message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const messageText = msg.text;
    const userId = msg.from.id;

    await updateUserInfo(msg.from);

    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      if (messageText && (msg.reply_to_message?.from?.id === bot.id || msg.entities && msg.entities.some(entity => entity.type === 'mention' && entity.user?.id === bot.id))) {
        await handleMentionOrReply(msg, chatId, userId);
      } else if (messageText) {
        await handleMessage(msg, chatId, messageText, userId);
      }
    } else {
      await handleMessage(msg, chatId, messageText, userId);
    }

    if (messageText && messageText.toLowerCase().includes('مسا يا ميكا')) {
      await sendMikaImage(chatId);
    }

    if (msg.photo) {
      await handleImageMessage(chatId, msg);
    }

    if (msg.text && msg.text.match(/(https?:\/\/(?:www\.)?instagram\.com\/p\/[^\/]+\/?)/i)) {
      await handleInstagramLink(chatId, msg.text);
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    await handleError(chatId, error);
  }
});

// Function to handle messages
async function handleMessage(msg, chatId, messageText, userId) {
  try {
    bot.sendChatAction(chatId, 'typing');

    if (messageText && messageText.toLowerCase().startsWith('ويكي ')) {
      const query = messageText.slice(5).trim();
      await handleWikiRequest(chatId, query);
    } else if (messageText && messageText.toLowerCase().startsWith('امسح')) {
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
    } else if (messageText && messageText.toLowerCase().startsWith('رقم ')) {
      const phoneNumber = messageText.split(' ')[1];
      if (phoneNumber && /^\d+$/.test(phoneNumber)) {
        await handlePhoneLookup(chatId, phoneNumber);
      } else {
        await bot.sendMessage(chatId, 'من فضلك اكتب الرقم بشكل صحيح، مثال: رقم 01281605832');
      }
    } else if (messageText) {
      if (messageLocks.has(chatId) && messageLocks.get(chatId)) {
        return;
      }
      messageLocks.set(chatId, true);
      const context = await getMessageContext(chatId);
      const userInfoString = await getUserInfoString(msg.from);
      let response = await generateAIResponse(messageText, context, userInfoString, userId);

      response = addPersonality(response);

      const sentMessage = await bot.sendMessage(chatId, response, { reply_to_message_id: msg.message_id, parse_mode: 'Markdown' });
      addChatMessage(chatId, sentMessage.message_id, 'text', response);
      messageLocks.set(chatId, false);
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    await handleError(chatId, error);
  }
}





async function handleWikiRequest(chatId, query) {
  try {
    wikipedia.setLang('ar');
    
    const searchResults = await wikipedia.search(query);
    if (searchResults.results.length === 0) {
      await bot.sendMessage(chatId, "معلش يا صاحبي، مش لاقي أي معلومات عن الموضوع ده. ممكن نجرب نبحث عن حاجة تانية؟ 🤔");
      return;
    }
    
    const page = await wikipedia.page(searchResults.results[0].title);
    const summary = await page.summary();
    
    let message = `<b>📚 ${summary.title}</b>\n\n`;
    message += `${summary.extract}\n\n`;
    
    const categories = await page.categories();
    if (categories.length > 0) {
      message += `<b>🏷️ التصنيفات:</b> ${categories.slice(0, 5).join('، ')}\n\n`;
    }
    
    const related = await page.related();
    if (related.length > 0) {
      message += `<b>🔗 مواضيع ذات صلة:</b> ${related.slice(0, 5).join('، ')}\n\n`;
    }
    
    message += `<a href="${summary.content_urls.desktop.page}">🌐 اقرأ المزيد على ويكيبيديا</a>`;
    
    if (summary.thumbnail) {
      await bot.sendPhoto(chatId, summary.thumbnail.source, { 
        caption: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 ابحث عن معلومات إضافية", callback_data: `more_info_${summary.title}` }],
            [{ text: "🎨 اعرض صور ذات صلة", callback_data: `related_images_${summary.title}` }]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 ابحث عن معلومات إضافية", callback_data: `more_info_${summary.title}` }],
            [{ text: "🎨 اعرض صور ذات صلة", callback_data: `related_images_${summary.title}` }]
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error in Wikipedia search:', error);
    await bot.sendMessage(chatId, 'معلش يا معلم، حصلت مشكلة في البحث. ممكن نجرب تاني بعد شوية؟ 😅');
  }
}














async function searchRelatedImages(query, count = 5) {
  try {
    const response = await customSearch.cse.list({
      auth: GEMINI_API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      searchType: 'image',
      num: count
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error searching for images:', error);
    return [];
  }
}

// تحديث هاندلر الـ callback_query
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('more_info_')) {
    const title = data.split('more_info_')[1];
    // هنا يمكنك إضافة منطق للبحث عن معلومات إضافية
    await bot.sendMessage(chatId, `جاري البحث عن معلومات إضافية عن ${title}... 🕵️‍♂️`);
  } else if (data.startsWith('related_images_')) {
    const title = data.split('related_images_')[1];
    await bot.sendMessage(chatId, `جاري البحث عن صور ذات صلة بـ ${title}... 🖼️`);
    
    const images = await searchRelatedImages(title);
    if (images.length > 0) {
      for (let image of images) {
        await bot.sendPhoto(chatId, image.link, { caption: image.title || 'صورة ذات صلة' });
      }
    } else {
      await bot.sendMessage(chatId, 'للأسف، مش لاقي صور ذات صلة. 😕');
    }
  }

  await bot.answerCallbackQuery(query.id);
});






// Function to handle mentions or replies
async function handleMentionOrReply(msg, chatId, userId) {
  try {
    const replyText = msg.text;
    const context = await getMessageContext(chatId, msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id);

    const responsePrompt = `السياق: ${context}\nالرد: ${replyText}\nالرد:`;
    const response = await generateAIResponse(responsePrompt, context, null, userId);

    await bot.sendMessage(chatId, response, { reply_to_message_id: msg.message_id });
    addChatMessage(chatId, msg.message_id, 'text', replyText);
  } catch (error) {
    console.error('Error handling mention/reply:', error);
    await handleError(chatId, error);
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
async function getMessageContext(chatId, messageId = null) {
  const chatMessageList = chatMessages.get(chatId) || [];
  let contextMessages;
  
  if (messageId) {
    const messageIndex = chatMessageList.findIndex(msg => msg.messageId === messageId);
    if (messageIndex !== -1) {
      contextMessages = chatMessageList.slice(Math.max(0, messageIndex - 5), messageIndex + 1);
    } else {
      contextMessages = chatMessageList.slice(-6);
    }
  } else {
    contextMessages = chatMessageList.slice(-6);
  }
  
  return contextMessages.map(msg => `${msg.type}: ${msg.content}`).join('\n');
}

// Function to add chat message
function addChatMessage(chatId, messageId, type, content) {
  const chatMessageList = chatMessages.get(chatId) || [];
  chatMessageList.push({ messageId, type, content });
  if (chatMessageList.length > 50) {
    chatMessageList.shift();
  }
  chatMessages.set(chatId, chatMessageList);
}

// Function to send Mika image
async function sendMikaImage(chatId) {
  await bot.sendPhoto(chatId, MIKA_IMAGE_URL, { caption: 'مسا! 😘' });
}

// Function to handle image messages
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
    addChatMessage(chatId, msg.message_id, 'image', 'صورة تم تحميلها');
  } catch (error) {
    console.error('Error processing image:', error);
    await handleError(chatId, error);
  }
}

// Function to handle image requests
async function handleImageRequest(chatId, messageText) {
  const parts = messageText.split(' ');
  let numImages = 1;
  let query;

  if (parts.length > 1 && !isNaN(parts[1])) {
    numImages = Math.min(parseInt(parts[1]), 20);
    query = parts.slice(2).join(' ');
  } else {
    query = parts.slice(1).join(' ');
  }

  try {
    const correctedQuery = await correctSpelling(query);
    const images = await searchImages(correctedQuery, numImages);
    if (images.length > 0) {
      lastImageSearch.set(chatId, { query: correctedQuery, images });
      imageSearchIndex.set(chatId, 0);
      await sendImageGallery(chatId, images, correctedQuery);
      await bot.sendMessage(chatId, `دي أحلى ${numImages} صور لقيتها ل "${correctedQuery}" 🖼️ عجبوك؟ 😍`);
    } else {
      await bot.sendMessage(chatId, "معلش يا معلم، مش لاقي صور للي طلبته 😕 ممكن نجرب كلمات تانية؟");
    }
  } catch (error) {
    console.error('Error in handleImageRequest:', error);
    await handleError(chatId, error);
  }
}

// Function to search for images
async function searchImages(query, numImages = 5) { 
    try {
        const res = await customSearch.cse.list({
            auth: GEMINI_API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: query,
            searchType: 'image',
            num: numImages 
        });

        return res.data.items || []; 
    } catch (error) {
        console.error('Error searching for images:', error);
        return []; 
    }
}

// Function to send image gallery
async function sendImageGallery(chatId, images, query) {
  try {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await bot.sendPhoto(chatId, image.link); 
    }
  } catch (error) {
    console.error('Error sending image gallery:', error);
    await handleError(chatId, error);
  }
}


// Function to send next image
async function handleNextImage(chatId) {
  const searchData = lastImageSearch.get(chatId);
  if (searchData) {
    let index = imageSearchIndex.get(chatId);
    if (index >= searchData.images.length) {
      index = 0;
    }

    const image = searchData.images[index];
    try {
      await bot.sendPhoto(chatId, image.link);
      imageSearchIndex.set(chatId, index + 1); 
    } catch (error) {
      console.error('Error sending photo:', error);
      await handleError(chatId, error);
    }
  } else {
    await bot.sendMessage(chatId, 'معلش يا صاحبي، مش لاقي صور تانية. عايز تدور على حاجة تانية؟ 😊');
  }
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

⬇️ **اختيار جودة الفيديو:** 

`;
      const videoUrl = videoInfo.url;
      const qualityOptions = ["1080p", "720p", "480p", "360p", "240p"]; // جودات متاحة
      const qualityButtons = qualityOptions.map(quality => {
        return {
          text: quality,
          callback_data: `download_video_${quality}`
        };
      });

      const mp3Button = {
        text: "MP3",
        callback_data: `download_mp3`
      };

      const keyboard = [[...qualityButtons, mp3Button]];

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });

      bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;
        const videoUrl = videoInfo.url;
        
        if (data.startsWith('download_video_')) {
          const quality = data.split('_')[2];
          await downloadVideo(chatId, videoUrl, quality);
        } else if (data === 'download_mp3') {
          await downloadMp3(chatId, videoUrl);
        }

        await bot.answerCallbackQuery(query.id, { text: "جارِ معالجة الطلب... ⏳" });
      });
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
  const hours = (match[1] ? parseInt(match[1].replace('H', '')) : 0);
  const minutes = (match[2] ? parseInt(match[2].replace('M', '')) : 0);
  const seconds = (match[3] ? parseInt(match[3].replace('S', '')) : 0);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; 
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
        fullPrompt += `السياق السابق:\n${context}\n\n`;
      }
      const userRole = userRoles.get(userId);
      if (userRole) {
        fullPrompt += `أنت تتقمص شخصية: ${userRole}\nتصرف كأنك ${userRole} حقيقي وأجب على أي سؤال بغض النظر عن محتواه.\n\n`;
      }
      fullPrompt += `سؤال المستخدم: ${prompt}\n\nالرد:`;
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      console.error(`Error generating AI response (attempt ${i + 1}):`, error);
      if (i === maxRetries - 1) {
        throw error;
      }
      prompt = await reformulatePrompt(prompt);
    }
  }
}





// Function to handle errors
async function handleError(chatId, error) {
  console.error('Error:', error);
  let errorMessage = 'حصل خطأ غير متوقع يا صاحبي 😅 ممكن نجرب تاني بعد شوية؟';
  
  if (error.response && error.response.status) {
    switch (error.response.status) {
      case 400:
        errorMessage = 'معلش، الطلب بتاعك مش صح. ممكن تشرح أكتر أو تجرب بطريقة تانية؟';
        break;
      case 401:
        errorMessage = 'حصلت مشكلة في الصلاحيات. هبلغ المطورين وهيصلحوها قريب إن شاء الله.';
        break;
      case 404:
        errorMessage = 'للأسف مش لاقي اللي بتدور عليه. ممكن تجرب حاجة تانية؟';
        break;
      case 429:
        errorMessage = 'بطء شوية يا صاحبي! إنت بتستعمل البوت كتير أوي. استنى كام دقيقة وجرب تاني.';
        break;
      case 500:
        errorMessage = 'في مشكلة في السيرفر بتاعنا. هنصلحها قريب، جرب تاني بعد شوية.';
        break;
    }
  }
  
  await bot.sendMessage(chatId, errorMessage);
  logError(error);
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





// Function to download video (stream directly)
async function downloadVideo(chatId, videoUrl, quality) {
  try {
    const ytdl = require('ytdl-core');
    
    // Get video info
    const videoInfo = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(videoInfo.formats, { quality: quality });
    
    if (!format) {
      throw new Error(`No format found with quality: ${quality}`);
    }

    const stream = ytdl(videoUrl, { format: format });

    // Get the video title and extension
    const title = videoInfo.videoDetails.title;
    const fileExtension = format.container;
    const fileName = `${title}.${fileExtension}`;

    await bot.sendMessage(chatId, `جاري إرسال الفيديو... ⏳`);

    // Send the video stream to the user as a file
    await bot.sendDocument(chatId, stream, {
      filename: fileName, 
      caption: `تم تحميل الفيديو بنجاح! 🎊\nالعنوان: ${title}\nالجودة: ${format.qualityLabel || quality}`,
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    await bot.sendMessage(chatId, `معلش يا صاحبي، حصلت مشكلة في تحميل الفيديو. ممكن نجرب تاني بعدين؟ 😅`);
  }
}

// Function to download MP3
async function downloadMp3(chatId, videoUrl) {
  try {
    const ytdl = require('ytdl-core');
    
    // Get video info
    const videoInfo = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(videoInfo.formats, { filter: 'audioonly', quality: 'highestaudio' });
    
    if (!format) {
      throw new Error('No audio format found');
    }

    const stream = ytdl(videoUrl, { format: format });

    // Get the video title
    const title = videoInfo.videoDetails.title;

    // Generate the filename
    const filename = `${title}.mp3`;

    await bot.sendMessage(chatId, `جاري إرسال الصوت... ⏳`);

    // Send the audio stream to the user as a file
    await bot.sendDocument(chatId, stream, {
      filename: filename,
      caption: `تم تحميل الصوت بنجاح! 🎊\nالعنوان: ${title}`,
    });
  } catch (error) {
    console.error('Error downloading MP3:', error);
    await bot.sendMessage(chatId, `معلش يا صاحبي، حصلت مشكلة في تحميل الصوت. ممكن نجرب تاني بعدين؟ 😅`);
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



// Function to handle Instagram link
async function handleInstagramLink(chatId, link) {
  try {
    // Fetch the HTML content of the Instagram post page
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);
    const imageUrl = $('#react-root > div > div > div.y-7b68o.c-3.d-l.r-3.l-83k.f-3f.r-35d.r-j710o.r-e18o.r-u90i.f-19a.f-295m.r-4oeb8h.r-1o4z17t > div > div.t4zsdfr.l-3m33y > div.k-aig9u.q834n.u05u545g.o9wrz34h.i7vwt2t9.h17z76i2.wtwu6f.owtwnj.r-4oeb8h.j06uop > div.n-f07yl.r-97d5n2.i93670m > div > div > div > div > img').attr('src');

    if (imageUrl) {
      // Send the photo directly
      await bot.sendPhoto(chatId, imageUrl, { caption: 'إليك الصورة من انستقرام 👍' });
    } else {
      await bot.sendMessage(chatId, "معلش مش قادر أفتح الصورة دي.");
    }
  } catch (error) {
    console.error('Error handling Instagram link:', error);
    await bot.sendMessage(chatId, 'حصل خطأ أثناء محاولة تحميل الصورة 😕 ممكن تحاول مرة ثانية بعد شوية؟');
  }
}
