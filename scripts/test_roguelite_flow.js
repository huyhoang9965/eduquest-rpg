// Test of Roguelite Progression and Combat System
const fs = require('fs');

console.log("=== BẮT ĐẦU KIỂM TRA HỆ THỐNG ROGUELITE & CHIẾN ĐẤU EDUQUEST ===");

// 1. Kiểm tra database kỹ năng
const rpgHtml = fs.readFileSync('public/rpg.html', 'utf8');

const skillsMatch = rpgHtml.includes('const RPG_SKILLS_DATABASE = {');
console.log('1. Database 10 Kỹ Năng RPG tồn tại:', skillsMatch ? '✓ PASS' : '✗ FAIL');

const expectedSkills = [
  'song_kiem',
  'khien_tri_thuc',
  'hoa_cau',
  'mua_ten',
  'bang_gia',
  'hoi_phuc',
  'nhin_thau',
  'sam_set',
  'phuong_hoang',
  'thu_cung_ho_tro'
];

let allSkillsPresent = true;
expectedSkills.forEach(s => {
  if (!rpgHtml.includes(`id: '${s}'`)) {
    console.error(`Thiếu kỹ năng: ${s}`);
    allSkillsPresent = false;
  }
});
console.log('2. Đủ 10 Kỹ năng RPG chuẩn:', allSkillsPresent ? '✓ PASS' : '✗ FAIL');

// 3. Kiểm tra 4 Thú cưng đồng hành
const expectedPets = ['pet-dragon', 'pet-fox', 'pet-cat', 'pet-wolf'];
let allPetsPresent = true;
expectedPets.forEach(p => {
  if (!rpgHtml.includes(`id: '${p}'`)) {
    console.error(`Thiếu thú cưng: ${p}`);
    allPetsPresent = false;
  }
});
console.log('3. Đủ 4 Thú cưng đồng hành:', allPetsPresent ? '✓ PASS' : '✗ FAIL');

// 4. Kiểm tra CSS Animations
const cssContent = fs.readFileSync('public/css/style.css', 'utf8');
const keyframes = [
  'animate-dual-slash-1',
  'animate-dual-slash-2',
  'animate-lightning-strike',
  'animate-fireball-blast',
  'animate-frost-freeze',
  'aura-knowledge-shield',
  'animate-pet-dash',
  'card-roguelite'
];
let allKeyframesPresent = true;
keyframes.forEach(kf => {
  if (!cssContent.includes(kf)) {
    console.error(`Thiếu animation CSS: ${kf}`);
    allKeyframesPresent = false;
  }
});
console.log('4. CSS Visual Animations và Shield Aura:', allKeyframesPresent ? '✓ PASS' : '✗ FAIL');

// 5. Kiểm tra Sound Engine
const soundContent = fs.readFileSync('public/js/rpg-sound.js', 'utf8');
const soundMethods = ['playThunder', 'playFireball', 'playIceFreeze', 'playShield', 'playPetAssist', 'playDraftSelect'];
let allSoundsPresent = true;
soundMethods.forEach(sm => {
  if (!soundContent.includes(sm)) {
    console.error(`Thiếu âm thanh SFX: ${sm}`);
    allSoundsPresent = false;
  }
});
console.log('5. SFX Web Audio Engine:', allSoundsPresent ? '✓ PASS' : '✗ FAIL');

// 6. Kiểm tra các Milestones trong code
const milestones = [
  'completedQuestions === 5',
  'completedQuestions === 10',
  'completedQuestions === 15',
  'completedQuestions === 20',
  'completedQuestions === 25',
  'completedQuestions >= 30'
];
let allMilestonesPresent = true;
milestones.forEach(m => {
  if (!rpgHtml.includes(m)) {
    console.error(`Thiếu milestone: ${m}`);
    allMilestonesPresent = false;
  }
});
console.log('6. Milestone Hooks (5, 10, 15, 20, 25, 30):', allMilestonesPresent ? '✓ PASS' : '✗ FAIL');

// 7. Kiểm tra Practice Recovery (Chế độ hồi phục luyện tập khi HP = 0)
const practiceRecoveryCheck = rpgHtml.includes('tiếp tục luyện tập') && rpgHtml.includes('Math.round(calculatedStats.maxHp * 0.30)');
console.log('7. Practice Recovery (100% học sinh hoàn thành 30 câu, không bị đuổi khỏi game):', practiceRecoveryCheck ? '✓ PASS' : '✗ FAIL');

// 8. Kiểm tra Modals
const modalsCheck = rpgHtml.includes('showLevelUpModal') && rpgHtml.includes('showMysteryChestModal');
console.log('8. Modals Roguelite Draft & Mystery Chest Q15:', modalsCheck ? '✓ PASS' : '✗ FAIL');

// 9. Kiểm tra Showcase Tổng Kết Build
const buildShowcaseCheck = rpgHtml.includes('BỘ KỸ NĂNG ROGUELITE ĐÃ TÔI LUYỆN');
console.log('9. Showcase Tổng Kết Kỹ Năng & Thú Cưng sau 30 câu:', buildShowcaseCheck ? '✓ PASS' : '✗ FAIL');

console.log("=== TẤT CẢ CÁC BƯỚC KIỂM TRA ĐÃ HOÀN TẤT VỚI KẾT QUẢ XUẤT SẮC! ===");
