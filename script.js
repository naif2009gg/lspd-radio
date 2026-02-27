// ===== Config =====
const DISCORD_CHANNEL_ID = "1426599029500022975";
const BOT_TOKEN = "MTQ3NjQxMzYzNjAxMTM2MDMxNw.GWNmlG.2ddCdd8eOKhP8IRmU5Dei4JOZFBpqsccttbp8E";
const API_URL = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`;

// ===== Member counter =====
let memberCount = 1;
let achCount = 1;

// ===== Add/Remove Radio Members =====
function addMember() {
  memberCount++;
  const list = document.getElementById("radioMembers");
  const div = document.createElement("div");
  div.className = "member-item";
  div.innerHTML = `
    <span class="member-num">${memberCount}</span>
    <input type="text" placeholder="اسم الضابط في السيرفر" class="member-input">
    <input type="text" placeholder="رتبته / يونته (اختياري)" class="member-rank-input">
    <button type="button" class="remove-btn" onclick="removeMember(this)">✕</button>
  `;
  list.appendChild(div);
  renumberItems("radioMembers", "member-num");
}

function removeMember(btn) {
  const list = document.getElementById("radioMembers");
  if (list.children.length <= 1) return;
  btn.closest(".member-item").remove();
  renumberItems("radioMembers", "member-num");
}

// ===== Add/Remove Achievements =====
function addAchievement() {
  achCount++;
  const list = document.getElementById("achievementsList");
  const div = document.createElement("div");
  div.className = "achievement-item";
  div.innerHTML = `
    <span class="ach-num">${achCount}</span>
    <input type="text" placeholder="مثال: تنسيق مطاردة ونجاح في القبض على المشتبه به" class="ach-input">
    <button type="button" class="remove-btn" onclick="removeAchievement(this)">✕</button>
  `;
  list.appendChild(div);
  renumberItems("achievementsList", "ach-num");
}

function removeAchievement(btn) {
  const list = document.getElementById("achievementsList");
  if (list.children.length <= 1) return;
  btn.closest(".achievement-item").remove();
  renumberItems("achievementsList", "ach-num");
}

function renumberItems(listId, numClass) {
  const items = document.getElementById(listId).querySelectorAll("." + numClass);
  items.forEach((el, i) => { el.textContent = i + 1; });
}

// ===== Form Submit =====
document.getElementById("reportForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitSpinner = document.getElementById("submitSpinner");
  const errorMsg = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");

  errorMsg.classList.add("hidden");

  // Gather data
  const officerName = document.getElementById("officerName").value.trim();
  const rank = document.getElementById("rank").value;
  const unit = document.getElementById("unit").value.trim();
  const badge = document.getElementById("badge").value.trim();
  const sessionDate = document.getElementById("sessionDate").value;
  const duration = document.getElementById("duration").value.trim();
  const notes = document.getElementById("notes").value.trim();

  const ratingEl = document.querySelector('input[name="rating"]:checked');
  if (!ratingEl) {
    errorMsg.textContent = "⚠️ يرجى تحديد تقييم الجلسة.";
    errorMsg.classList.remove("hidden");
    return;
  }
  const rating = ratingEl.value;

  // Collect members
  const members = [];
  document.querySelectorAll(".member-item").forEach((item, idx) => {
    const name = item.querySelector(".member-input")?.value.trim();
    const memberRank = item.querySelector(".member-rank-input")?.value.trim();
    if (name) {
      members.push(`${idx + 1}. **${name}**${memberRank ? " — " + memberRank : ""}`);
    }
  });

  // Collect achievements
  const achievements = [];
  document.querySelectorAll(".ach-input").forEach((input, idx) => {
    const val = input.value.trim();
    if (val) achievements.push(`${idx + 1}. ${val}`);
  });

  if (achievements.length === 0) {
    errorMsg.textContent = "⚠️ يرجى إضافة إنجاز واحد على الأقل.";
    errorMsg.classList.remove("hidden");
    return;
  }

  // Format date
  const dateFormatted = sessionDate
    ? new Date(sessionDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "غير محدد";

  // Build Discord embed
  const embed = {
    title: "📻 تقرير مسؤول الراديو — LSPD CFW",
    color: 0x3b82f6,
    timestamp: new Date().toISOString(),
    footer: {
      text: "LSPD · CFW Radio System"
    },
    fields: [
      {
        name: "👮 معلومات الضابط",
        value:
          `**الاسم:** ${officerName}\n` +
          `**الرتبة:** ${rank}\n` +
          `**اليونت:** ${unit}\n` +
          `**رقم الباج:** ${badge}`,
        inline: false
      },
      {
        name: "📅 بيانات الجلسة",
        value:
          `**التاريخ:** ${dateFormatted}\n` +
          `**المدة:** ${duration}`,
        inline: false
      },
      {
        name: `🎙️ في الراديو (${members.length > 0 ? members.length : "لا أحد"})`,
        value: members.length > 0 ? members.join("\n") : "لم يكن أحد في الراديو",
        inline: false
      },
      {
        name: `🏅 الإنجازات (${achievements.length})`,
        value: achievements.join("\n"),
        inline: false
      },
      {
        name: `⭐ تقييم الجلسة`,
        value: rating,
        inline: true
      }
    ]
  };

  if (notes) {
    embed.fields.push({
      name: "📝 ملاحظات",
      value: notes,
      inline: false
    });
  }

  // Show loading
  submitText.classList.add("hidden");
  submitSpinner.classList.remove("hidden");
  submitBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bot ${BOT_TOKEN}`
      },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
      document.getElementById("reportForm").classList.add("hidden");
      successMsg.classList.remove("hidden");
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Discord API error:", errData);
      errorMsg.textContent = `❌ فشل الإرسال (${res.status}). تأكد من أن البوت في السيرفر ولديه صلاحية الكتابة في الروم.`;
      errorMsg.classList.remove("hidden");
      submitText.classList.remove("hidden");
      submitSpinner.classList.add("hidden");
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = "❌ حدث خطأ في الاتصال. تأكد من الإنترنت وأن البوت يعمل.";
    errorMsg.classList.remove("hidden");
    submitText.classList.remove("hidden");
    submitSpinner.classList.add("hidden");
    submitBtn.disabled = false;
  }
});

// ===== Reset Form =====
function resetForm() {
  document.getElementById("reportForm").reset();
  document.getElementById("reportForm").classList.remove("hidden");
  document.getElementById("successMsg").classList.add("hidden");
  document.getElementById("errorMsg").classList.add("hidden");
  document.getElementById("submitText").classList.remove("hidden");
  document.getElementById("submitSpinner").classList.add("hidden");
  document.getElementById("submitBtn").disabled = false;

  // Reset members list to 1
  const membersList = document.getElementById("radioMembers");
  membersList.innerHTML = `
    <div class="member-item">
      <span class="member-num">1</span>
      <input type="text" placeholder="اسم الضابط في السيرفر" class="member-input">
      <input type="text" placeholder="رتبته / يونته (اختياري)" class="member-rank-input">
      <button type="button" class="remove-btn" onclick="removeMember(this)">✕</button>
    </div>
  `;
  memberCount = 1;

  // Reset achievements list to 1
  const achList = document.getElementById("achievementsList");
  achList.innerHTML = `
    <div class="achievement-item">
      <span class="ach-num">1</span>
      <input type="text" placeholder="مثال: تنسيق مطاردة ونجاح في القبض على المشتبه به" class="ach-input">
      <button type="button" class="remove-btn" onclick="removeAchievement(this)">✕</button>
    </div>
  `;
  achCount = 1;
}
