const fs = require('fs');
const path = require('path');

const rpgPath = path.join(__dirname, '..', 'public', 'rpg.html');
let content = fs.readFileSync(rpgPath, 'utf8');

// 1. Sửa đoạn kiểm tra 30 câu trong handleStartJourneyBattle
const oldValidation = `          if (!data.success || !data.data || !Array.isArray(data.data.questions) || data.data.questions.length !== 30) {
            alert("Bộ câu hỏi này chưa đủ đúng 30 câu hỏi hợp lệ! Vui lòng vào trang Quản Lý để hoàn thiện đủ 30 câu.");
            return;
          }

          const setFull = data.data;`;

const newValidation = `          if (!data.success || !data.data || !Array.isArray(data.data.questions) || data.data.questions.length === 0) {
            alert("Bộ câu hỏi này chưa có câu hỏi nào! Vui lòng vào trang Quản Lý để thêm câu hỏi.");
            return;
          }

          const setFull = data.data;

          // Tự động đảm bảo 30 câu: nếu ít hơn 30 câu thì lặp vòng để đủ 30 lượt trận chiến
          let effectiveQuestions = [...setFull.questions];
          if (effectiveQuestions.length < 30) {
            const originalLen = effectiveQuestions.length;
            while (effectiveQuestions.length < 30) {
              const clone = JSON.parse(JSON.stringify(effectiveQuestions[effectiveQuestions.length % originalLen]));
              clone.id = \`\${clone.id}-cycle-\${effectiveQuestions.length}\`;
              effectiveQuestions.push(clone);
            }
          } else if (effectiveQuestions.length > 30) {
            effectiveQuestions = effectiveQuestions.slice(0, 30);
          }`;

if (content.includes('data.data.questions.length !== 30')) {
  content = content.replace(
    /if \(!data\.success \|\| !data\.data \|\| !Array\.isArray\(data\.data\.questions\) \|\| data\.data\.questions\.length !== 30\) \{[\s\S]*?alert\("Bộ câu hỏi này chưa đủ đúng 30 câu hỏi hợp lệ! Vui lòng vào trang Quản Lý để hoàn thiện đủ 30 câu\."\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?const setFull = data\.data;/,
    newValidation
  );
  console.log('✓ Đã cập nhật xong validation câu hỏi trong handleStartJourneyBattle!');
}

// Thay thế setSnapshot: setFull.questions -> setSnapshot: effectiveQuestions
content = content.replace(
  'setSnapshot: setFull.questions, // Snapshot bất biến 30 câu',
  'setSnapshot: typeof effectiveQuestions !== "undefined" ? effectiveQuestions : setFull.questions, // Snapshot 30 câu'
);

// 2. Cập nhật thẻ hiển thị bộ câu hỏi trong journey_select_set
const oldBadge = `<span class="text-xs text-emerald-400 font-mono font-bold">Đủ 30 câu ✓</span>`;
const newBadge = `<span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full \${set.status === 'published' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                              \${set.questionCount || 30} câu • \${set.status === 'published' ? 'Đã Xuất Bản ✓' : 'Bản Tự Tạo 📝'}
                            </span>`;

if (content.includes('Đủ 30 câu ✓')) {
  content = content.replace(oldBadge, newBadge);
  console.log('✓ Đã cập nhật badge số lượng câu hỏi và trạng thái!');
}

// Thêm nút "Tạo / Quản lý Bộ Đề Mới" ở header chọn bộ đề
const oldHeader = `<button onClick={() => setScreen('landing')} class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold">
                    ← Quay lại
                  </button>`;

const newHeader = `<div class="flex items-center gap-2">
                    <a href="/creator.html" target="_blank" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-black text-xs font-fantasy flex items-center gap-1 shadow">
                      <span>➕</span> Quản Lý / Tạo Bộ Đề Mới
                    </a>
                    <button onClick={() => setScreen('landing')} class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold">
                      ← Quay lại
                    </button>
                  </div>`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  console.log('✓ Đã thêm nút Quản Lý / Tạo Bộ Đề Mới vào header!');
}

fs.writeFileSync(rpgPath, content, 'utf8');
console.log('✓ Đã cập nhật public/rpg.html thành công!');
