// HỆ THỐNG DỮ LIỆU GAME RPG EDUQUEST (CLASSES, WORLDS, ITEMS, PETS, QUESTS)
// Cập nhật đầy đủ Sprite Images từ 5 hình ảnh tham chiếu chính thức

window.RPG_DATA = {
  // ==========================================
  // 1. HỆ THỐNG NGHỀ NGHIỆP (CLASSES)
  // ==========================================
  classes: {
    warrior: {
      id: "warrior",
      name: "Chiến Binh",
      englishTitle: "Dragon Warrior",
      image: "/assets/heroes/warrior.png",
      avatar: "/assets/heroes/warrior.png",
      weaponIcon: "/assets/items/sword.png",
      color: "#ef4444",
      accentBg: "from-red-600 to-amber-700",
      description: "Bậc thầy kiếm thuật với lượng máu dồi dào, khả năng phòng thủ kiên cố và đòn chém sấm sét uy lực.",
      baseStats: { hp: 130, mp: 60, atk: 22, def: 16, spd: 10 },
      skills: [
        { id: "w1", name: "Chém Sấm Sét", manaCost: 20, desc: "Đòn kiếm tích điện gây 1.5x sát thương chuẩn.", icon: "⚡" },
        { id: "w2", name: "Khiên Thép Kiên Cố", manaCost: 25, desc: "Tăng 50% phòng thủ và giảm nửa sát thương đợt sau.", icon: "🛡️" },
        { id: "w3", name: "Hỏa Long Trảm", manaCost: 45, desc: "Tuyệt kỹ chém rồng gây 2.5x sát thương thiêu đốt quái vật.", icon: "🔥" }
      ]
    },
    mage: {
      id: "mage",
      name: "Pháp Sư",
      englishTitle: "Arcane Sorcerer",
      image: "/assets/heroes/mage.png",
      avatar: "/assets/heroes/mage.png",
      weaponIcon: "/assets/items/staff.png",
      color: "#a855f7",
      accentBg: "from-purple-600 to-indigo-800",
      description: "Bậc thầy nguyên tố khai thác sức mạnh của lửa, băng và sấm sét. Sở hữu lượng sát thương phép thuật bùng nổ.",
      baseStats: { hp: 95, mp: 130, atk: 28, def: 9, spd: 12 },
      skills: [
        { id: "m1", name: "Cầu Lửa Hủy Diệt", manaCost: 25, desc: "Bắn quả cầu lửa khổng lồ nổ tung gây 1.6x sát thương.", icon: "☄️" },
        { id: "m2", name: "Bão Băng Giá", manaCost: 35, desc: "Đóng băng đối thủ, làm giảm 40% sát thương phản công.", icon: "❄️" },
        { id: "m3", name: "Thiên Thạch Tận Thế", manaCost: 55, desc: "Triệu hồi thiên thạch vũ trụ gây 3.0x sát thương hủy diệt.", icon: "🌌" }
      ]
    },
    archer: {
      id: "archer",
      name: "Cung Thủ",
      englishTitle: "Wind Ranger",
      image: "/assets/heroes/archer.png",
      avatar: "/assets/heroes/archer.png",
      weaponIcon: "/assets/items/bow.png",
      color: "#10b981",
      accentBg: "from-emerald-600 to-teal-800",
      description: "Thợ săn bóng đêm với tốc độ xé gió, khả năng bắn liên hoàn và tỉ lệ ra đòn chí mạng cực cao.",
      baseStats: { hp: 105, mp: 90, atk: 24, def: 12, spd: 18 },
      skills: [
        { id: "a1", name: "Tên Xuyên Phá", manaCost: 20, desc: "Mũi tên xé gió xuyên giáp gây 1.5x sát thương.", icon: "🎯" },
        { id: "a2", name: "Mưa Tên Bão Tố", manaCost: 30, desc: "Bắn liên tiếp 3 mũi tên liên kích trúng mục tiêu.", icon: "🌪️" },
        { id: "a3", name: "Bách Bộ Xuyên Dương", manaCost: 50, desc: "Phát bắn chí mạng tối thượng nhân 2.8x sát thương tức thì.", icon: "✨" }
      ]
    }
  },

  // ==========================================
  // 2. BẢN ĐỒ THẾ GIỚI & CÁC MÀN CHƠI (WORLDS)
  // Tích hợp tọa độ điểm đánh dấu trên Đảo Phiêu Lưu (adventure_world_map)
  // ==========================================
  worlds: [
    {
      id: "world-1",
      name: "Khu Rừng Tri Thức",
      subtitle: "Vùng đất khởi đầu dành cho tân thủ",
      difficultyTag: "Dễ (Khởi Động)",
      color: "#10b981",
      bgGradient: "from-emerald-950 via-teal-900 to-black",
      icon: "🌲",
      requiredLevel: 1,
      stages: [
        {
          id: "w1-s1",
          stageNumber: 1,
          name: "Ải 1: Bụi Rậm Khởi Đầu",
          mapX: 20,
          mapY: 74,
          monster: {
            name: "Slime Tinh Nghịch",
            image: "/assets/monsters/slime.png",
            avatar: "/assets/monsters/slime.png",
            hp: 60,
            maxHp: 60,
            atk: 8,
            expReward: 35,
            goldReward: 30,
            itemDrop: "potion_hp"
          },
          topic: "Số Tự Nhiên & Từ Vựng Khởi Động"
        },
        {
          id: "w1-s2",
          stageNumber: 2,
          name: "Ải 2: Đầm Lầy Nấm Độc",
          mapX: 28,
          mapY: 65,
          monster: {
            name: "Nấm Độc Biến Dị",
            image: "/assets/monsters/mushroom.png",
            avatar: "/assets/monsters/mushroom.png",
            hp: 90,
            maxHp: 90,
            atk: 12,
            expReward: 50,
            goldReward: 40,
            itemDrop: "potion_mp"
          },
          topic: "Hình Học & Hiện Tượng Tự Nhiên"
        },
        {
          id: "w1-s3",
          stageNumber: 3,
          name: "Ải 3: Lãnh Địa Sói Rừng",
          mapX: 24,
          mapY: 53,
          monster: {
            name: "Sói Rừng Hung Hãn",
            image: "/assets/monsters/wolf.png",
            avatar: "/assets/monsters/wolf.png",
            hp: 130,
            maxHp: 130,
            atk: 15,
            expReward: 70,
            goldReward: 55,
            itemDrop: "mana_crystal"
          },
          topic: "Tính Nhẩm Nhanh & Ngữ Pháp"
        },
        {
          id: "w1-boss",
          stageNumber: 4,
          name: "Ải Trùm: Ngai Vàng Đầm Lầy",
          isBoss: true,
          bossTitle: "👑 Vua Slime Khổng Lồ (King Slime)",
          mapX: 36,
          mapY: 48,
          monster: {
            name: "Vua Slime Khổng Lồ",
            image: "/assets/monsters/king_slime.png",
            avatar: "/assets/monsters/king_slime.png",
            hp: 200,
            maxHp: 200,
            atk: 18,
            expReward: 140,
            goldReward: 120,
            gemReward: 10,
            isBoss: true,
            phase2Hp: 70,
            itemDrop: "chest_closed"
          },
          topic: "Đại Chiến Vua Slime Rừng Xanh"
        }
      ]
    },
    {
      id: "world-2",
      name: "Thung Lũng Tinh Thể & Hang Động",
      subtitle: "Thử thách tư duy giữa các tinh thể phát quang",
      difficultyTag: "Trung Bình",
      color: "#6366f1",
      bgGradient: "from-indigo-950 via-slate-900 to-black",
      icon: "🪨",
      requiredLevel: 3,
      stages: [
        {
          id: "w2-s1",
          stageNumber: 5,
          name: "Ải 5: Hốc Đá Dơi Quỷ",
          mapX: 47,
          mapY: 60,
          monster: {
            name: "Dơi Quỷ Siêu Thanh",
            image: "/assets/monsters/bat.png",
            avatar: "/assets/monsters/bat.png",
            hp: 160,
            maxHp: 160,
            atk: 20,
            expReward: 80,
            goldReward: 70,
            itemDrop: "potion_hp"
          },
          topic: "Phân Số & So Sánh Toán Học"
        },
        {
          id: "w2-s2",
          stageNumber: 6,
          name: "Ải 6: Mạng Nhện Pha Lê",
          mapX: 58,
          mapY: 53,
          monster: {
            name: "Nhện Tinh Thể Khổng Lồ",
            image: "/assets/monsters/spider.png",
            avatar: "/assets/monsters/spider.png",
            hp: 210,
            maxHp: 210,
            atk: 24,
            expReward: 100,
            goldReward: 90,
            itemDrop: "mana_crystal"
          },
          topic: "Âm Thanh & Không Khí"
        },
        {
          id: "w2-s3",
          stageNumber: 7,
          name: "Ải 7: Hầm Golem Cổ Đại",
          mapX: 53,
          mapY: 39,
          monster: {
            name: "Golem Khổng Lồ Đá Cổ",
            image: "/assets/monsters/golem.png",
            avatar: "/assets/monsters/golem.png",
            hp: 280,
            maxHp: 280,
            atk: 27,
            expReward: 130,
            goldReward: 110,
            isBoss: true,
            phase2Hp: 90,
            itemDrop: "shield"
          },
          topic: "Toán Chuyển Động & Giới Từ"
        }
      ]
    },
    {
      id: "world-3",
      name: "Lâu Đài Phép Thuật Cổ",
      subtitle: "Vương quốc bóng đêm của các phù thủy cổ đại",
      difficultyTag: "Khó",
      color: "#a855f7",
      bgGradient: "from-purple-950 via-violet-950 to-black",
      icon: "🏰",
      requiredLevel: 5,
      stages: [
        {
          id: "w3-s1",
          stageNumber: 8,
          name: "Ải 8: Cổng Thành Đổ Nát",
          mapX: 32,
          mapY: 28,
          monster: {
            name: "Pháp Sư Hắc Ám Cổ Tộc",
            image: "/assets/monsters/dark_wizard.png",
            avatar: "/assets/monsters/dark_wizard.png",
            hp: 360,
            maxHp: 360,
            atk: 32,
            expReward: 180,
            goldReward: 150,
            itemDrop: "spellbook"
          },
          topic: "Toán Logic & Sinh Học Tế Bào"
        },
        {
          id: "w3-s2",
          stageNumber: 9,
          name: "Ải 9: Đỉnh Tháp Ma Trận",
          mapX: 38,
          mapY: 18,
          monster: {
            name: "Chúa Tể Hắc Ám Tối Thượng",
            image: "/assets/monsters/dark_wizard.png",
            avatar: "/assets/monsters/dark_wizard.png",
            hp: 450,
            maxHp: 450,
            atk: 38,
            expReward: 250,
            goldReward: 200,
            gemReward: 25,
            isBoss: true,
            phase2Hp: 150,
            itemDrop: "trophy"
          },
          topic: "Hình Học Không Gian & Mệnh Đề"
        }
      ]
    },
    {
      id: "world-4",
      name: "Núi Lửa Rồng Thiêng",
      subtitle: "Thử thách tối thượng bảo vệ hòn đảo học viện",
      difficultyTag: "Huyền Thoại",
      color: "#ef4444",
      bgGradient: "from-red-950 via-rose-950 to-black",
      icon: "🌋",
      requiredLevel: 7,
      stages: [
        {
          id: "w4-boss",
          stageNumber: 10,
          name: "Ải Trùm Cuối: Đỉnh Núi Lửa",
          isBoss: true,
          bossTitle: "🐉 Hỏa Long Thần Cổ Đại (Ancient Fire Dragon)",
          mapX: 78,
          mapY: 28,
          monster: {
            name: "Hỏa Long Thần Cổ Đại",
            image: "/assets/monsters/fire_dragon.png",
            avatar: "/assets/monsters/fire_dragon.png",
            hp: 650,
            maxHp: 650,
            atk: 48,
            expReward: 500,
            goldReward: 500,
            gemReward: 100,
            isBoss: true,
            phase2Hp: 250,
            itemDrop: "medal"
          },
          topic: "Thử Thách Trùm Cuối Toàn Năng"
        }
      ]
    }
  ],

  // ==========================================
  // 3. CỬA HÀNG TRANG BỊ & VẬT PHẨM (SHOP)
  // Sử dụng 16 Icons Sprite chuẩn từ 05_equipment_and_rewards.png
  // ==========================================
  shopItems: [
    // Vũ khí
    {
      id: "wp-1",
      name: "Thanh Kiếm Hiệp Sĩ",
      type: "weapon",
      slot: "weapon",
      rarity: "common",
      price: 100,
      image: "/assets/items/sword.png",
      statBonus: { atk: 12 },
      desc: "Lưỡi kiếm thép sắc bén của hiệp sĩ học viện, tăng 12 Sức Mạnh."
    },
    {
      id: "wp-2",
      name: "Quyền Trượng Ma Thuật",
      type: "weapon",
      slot: "weapon",
      rarity: "rare",
      price: 220,
      image: "/assets/items/staff.png",
      statBonus: { atk: 18, mp: 35 },
      desc: "Trượng nạm ngọc nguyên tố, tăng 18 Sức Mạnh và 35 Năng Lượng Mana."
    },
    {
      id: "wp-3",
      name: "Cung Tên Tinh Anh",
      type: "weapon",
      slot: "weapon",
      rarity: "rare",
      price: 250,
      image: "/assets/items/bow.png",
      statBonus: { atk: 20, spd: 8 },
      desc: "Cung gỗ tiên cổ với dây cung xé gió, tăng 20 Sức Mạnh và 8 Tốc Độ."
    },
    {
      id: "wp-4",
      name: "Sách Cổ Phép Thuật",
      type: "weapon",
      slot: "weapon",
      rarity: "epic",
      price: 450,
      image: "/assets/items/spellbook.png",
      statBonus: { atk: 30, mp: 60 },
      desc: "Cuốn sách ma thuật cổ xưa ghi chép các bí thuật, tăng 30 Sức Mạnh và 60 Mana."
    },

    // Phòng ngự & Phụ kiện
    {
      id: "ar-1",
      name: "Khiên Hộ Vệ Thần Kỳ",
      type: "armor",
      slot: "shield",
      rarity: "rare",
      price: 180,
      image: "/assets/items/shield.png",
      statBonus: { def: 18, hp: 45 },
      desc: "Khiên kim loại vững chắc cản phá mọi đòn hiểm, tăng 18 Thủ và 45 Máu."
    },
    {
      id: "ar-2",
      name: "Mũ Sắt Chiến Binh",
      type: "helmet",
      slot: "helmet",
      rarity: "common",
      price: 130,
      image: "/assets/items/helmet.png",
      statBonus: { def: 10, hp: 30 },
      desc: "Mũ sắt bảo vệ đầu khỏi các va đập nguy hiểm, tăng 10 Thủ và 30 Máu."
    },
    {
      id: "ar-3",
      name: "Giày Gió Thần",
      type: "boots",
      slot: "boots",
      rarity: "rare",
      price: 160,
      image: "/assets/items/boots.png",
      statBonus: { spd: 12, def: 6 },
      desc: "Đôi giày nhẹ như lông hồng giúp né đòn chớp nhoáng, tăng 12 Tốc Độ."
    },
    {
      id: "ac-1",
      name: "Pha Lê Ma Thuật",
      type: "accessory",
      slot: "accessory",
      rarity: "epic",
      price: 320,
      image: "/assets/items/mana_crystal.png",
      statBonus: { mp: 50, atk: 15 },
      desc: "Viên pha lê tỏa ánh lam huyền bí, hồi phục năng lượng liên tục cho anh hùng."
    },
    {
      id: "ac-2",
      name: "Huy Chương Danh Dự",
      type: "accessory",
      slot: "accessory",
      rarity: "legendary",
      price: 600,
      image: "/assets/items/medal.png",
      statBonus: { atk: 25, def: 20, hp: 60 },
      desc: "Phần thưởng danh giá nhất của Học Viện Phiêu Lưu, tăng toàn diện mọi chỉ số."
    },

    // Bình Dược Phẩm & Tiêu Hao
    {
      id: "pot-1",
      name: "Bình Máu Thánh HP",
      type: "potion",
      rarity: "common",
      price: 35,
      image: "/assets/items/potion_hp.png",
      effect: "healHp",
      value: 60,
      desc: "Hồi phục tức thì 60 Điểm Máu (HP) trong trận chiến cam go."
    },
    {
      id: "pot-2",
      name: "Bình Năng Lượng MP",
      type: "potion",
      rarity: "common",
      price: 35,
      image: "/assets/items/potion_mp.png",
      effect: "healMp",
      value: 60,
      desc: "Hồi phục tức thì 60 Điểm Năng Lượng (MP) để sẵn sàng tung tuyệt chiêu."
    },
    {
      id: "pot-3",
      name: "Túi Vàng May Mắn",
      type: "reward",
      rarity: "rare",
      price: 150,
      image: "/assets/items/gold_coins.png",
      effect: "goldBag",
      value: 200,
      desc: "Mở ra nhận ngay 200 đồng tiền vàng để mua sắm vật phẩm quý."
    },
    {
      id: "pot-4",
      name: "Cuộn Giấy Nhiệm Vụ Cổ",
      type: "item",
      rarity: "rare",
      price: 50,
      image: "/assets/items/quest_scroll.png",
      effect: "hint",
      desc: "Mở khóa gợi ý tư duy tức thì khi gặp câu hỏi hóc búa."
    },
    {
      id: "pot-5",
      name: "Rương Báu Hoàng Gia",
      type: "chest",
      rarity: "legendary",
      price: 400,
      image: "/assets/items/chest_closed.png",
      imageOpen: "/assets/items/chest_open.png",
      effect: "randomLoot",
      desc: "Rương chứa trang bị Sử Thi hoặc Huyền Thoại ngẫu nhiên."
    }
  ],

  // ==========================================
  // 4. HỆ THỐNG THÚ CƯNG ĐỒNG HÀNH (PETS)
  // Sử dụng 4 Sprites Pet chính thức từ 01_heroes_and_pets.png
  // ==========================================
  pets: [
    {
      id: "pet-dragon",
      name: "Hỏa Long Tí Hon",
      title: "Rồng Lửa Can Đảm",
      image: "/assets/pets/pet_dragon.png",
      avatar: "/assets/pets/pet_dragon.png",
      price: 250,
      buffDesc: "Tăng +15% Vàng thưởng nhận được sau mỗi trận đấu.",
      buffType: "goldBonus",
      buffValue: 0.15,
      story: "Chú rồng con tinh nghịch nở ra từ đá núi lửa, rất thích tha tiền vàng về tổ."
    },
    {
      id: "pet-fox",
      name: "Cáo Tri Thức",
      title: "Hồ Ly Phép Thuật",
      image: "/assets/pets/pet_fox.png",
      avatar: "/assets/pets/pet_fox.png",
      price: 300,
      buffDesc: "Tăng +15% Điểm Kinh Nghiệm (EXP) giúp thăng cấp thần tốc.",
      buffType: "expBonus",
      buffValue: 0.15,
      story: "Linh vật thông thái của Khu Rừng Tri Thức, giúp chủ nhân mở mang trí tuệ."
    },
    {
      id: "pet-cat",
      name: "Mèo Phù Thủy",
      title: "Tiểu Miêu Huyền Bí",
      image: "/assets/pets/pet_cat.png",
      avatar: "/assets/pets/pet_cat.png",
      price: 220,
      buffDesc: "Hồi ngay 12 Máu (HP) mỗi khi người chơi trả lời đúng câu hỏi.",
      buffType: "healOnCorrect",
      buffValue: 12,
      story: "Chú mèo đội nón phù thủy, luôn dùng phép chữa lành mỗi khi bạn chọn đúng đáp án."
    },
    {
      id: "pet-wolf",
      name: "Sói Băng Tuyết",
      title: "Sói Tuyết Dũng Mãnh",
      image: "/assets/pets/pet_wolf.png",
      avatar: "/assets/pets/pet_wolf.png",
      price: 350,
      buffDesc: "Tăng +12% Sát Thương đòn đánh lên Quái Vật và Boss.",
      buffType: "damageBonus",
      buffValue: 0.12,
      story: "Người bảo vệ trung thành đến từ đỉnh băng giá, tiếp thêm uy lực cho từng đòn tấn công."
    }
  ],

  // ==========================================
  // 5. NHIỆM VỤ HÀNG NGÀY & THÀNH TỰU (QUESTS)
  // ==========================================
  dailyQuests: [
    { id: "dq-1", title: "Khởi Động Não Bộ", desc: "Trả lời đúng 5 câu hỏi bất kỳ", target: 5, current: 0, reward: { gold: 50, exp: 40 }, isClaimed: false },
    { id: "dq-2", title: "Thợ Săn Quái Thú", desc: "Đánh bại 2 quái vật trong bản đồ", target: 2, current: 0, reward: { gold: 80, exp: 60 }, isClaimed: false },
    { id: "dq-3", title: "Bậc Thầy Liên Hoàn", desc: "Đạt chuỗi trả lời đúng 3 câu liên tiếp (Combo 3x)", target: 1, current: 0, reward: { gold: 60, gems: 5 }, isClaimed: false },
    { id: "dq-4", title: "Kẻ Chinh Phục Trùm", desc: "Hạ gục thành công 1 Boss bất kỳ", target: 1, current: 0, reward: { gold: 150, gems: 15, exp: 120 }, isClaimed: false }
  ],

  achievements: [
    { id: "ach-1", title: "Tân Binh Học Viện", desc: "Hoàn thành màn chơi đầu tiên trong đời anh hùng", icon: "/assets/items/medal.png", isUnlocked: false },
    { id: "ach-2", title: "Chiến Binh Toán Học", desc: "Trả lời đúng 10 câu hỏi môn Toán", icon: "/assets/items/spellbook.png", isUnlocked: false },
    { id: "ach-3", title: "Pháp Sư Tiếng Anh", desc: "Trả lời đúng 10 câu hỏi môn Tiếng Anh", icon: "/assets/items/quest_scroll.png", isUnlocked: false },
    { id: "ach-4", title: "Nhà Bác Học Tí Hon", desc: "Trả lời đúng 10 câu hỏi môn Khoa Học", icon: "/assets/items/mana_crystal.png", isUnlocked: false },
    { id: "ach-5", title: "Kẻ Diệt Vua Slime", desc: "Đánh bại Boss Vua Slime Khổng Lồ", icon: "/assets/items/trophy.png", isUnlocked: false },
    { id: "ach-6", title: "Triệu Phú Học Viện", desc: "Tích lũy được tổng cộng 500 đồng Vàng", icon: "/assets/items/gold_coins.png", isUnlocked: false },
    { id: "ach-7", title: "Đại Hiệp Sĩ Cấp 5", desc: "Nâng cấp nhân vật đạt tới Cấp độ 5", icon: "/assets/items/sword.png", isUnlocked: false }
  ]
};
