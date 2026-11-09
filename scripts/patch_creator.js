const fs = require('fs');
const path = require('path');

const creatorPath = path.join(__dirname, '..', 'public', 'creator.html');
let content = fs.readFileSync(creatorPath, 'utf8');

// 1. Thêm hàm handleTogglePublish
const targetFunc = 'const handleDuplicateSet = async (setId) => {';
const newFunc = `      // Chuyển nhanh Xuất Bản / Bản Nháp
      const handleTogglePublish = async (setId) => {
        try {
          const fetcher = window.EduQuestAuth ? window.EduQuestAuth.fetchWithAuth.bind(window.EduQuestAuth) : fetch;
          const res = await fetcher(\`/api/custom-question-sets/\${setId}/toggle-publish\`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            fetchSets();
          } else {
            alert(data.error || "Không thể chuyển trạng thái!");
          }
        } catch (e) {
          alert("Lỗi: " + e.message);
        }
      };

      const handleDuplicateSet = async (setId) => {`;

if (!content.includes('handleTogglePublish')) {
  content = content.replace(targetFunc, newFunc);
  console.log('✓ Đã thêm hàm handleTogglePublish vào creator.html!');
}

// 2. Cho phép bấm vào badge trạng thái để bật/tắt Xuất Bản
const badgePattern = /<span class=\{`text-\[10px\] font-black uppercase px-2\.5 py-0\.5 rounded-full border \$\{[\s\S]*?\{isPublished \? '✓ Đã Xuất Bản' : '✎ Bản Nháp'\}[\s\S]*?<\/span>/;

const newBadgeHtml = `<button onClick={() => handleTogglePublish(set.id)} title="Nhấp để Bật/Tắt Xuất Bản cho học sinh" class={\`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border transition transform hover:scale-105 active:scale-95 cursor-pointer \${
                                  isPublished 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                }\`}>
                                {isPublished ? '✓ Đã Xuất Bản' : '✎ Bản Nháp'}
                              </button>`;

if (badgePattern.test(content)) {
  content = content.replace(badgePattern, newBadgeHtml);
  console.log('✓ Đã biến badge trạng thái thành nút chuyển nhanh 1-click!');
}

fs.writeFileSync(creatorPath, content, 'utf8');
console.log('✓ Đã cập nhật public/creator.html thành công!');
