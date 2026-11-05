export interface SurahMeta {
  number: number;
  nameAr: string;
  nameFr: string;
  meaningFr: string;
  ayahCount: number;
  revelationType: 'Mecquoise' | 'Médinoise';
  juzStart: number;
  hizbStart: number;
}

export interface HalfHizbMeta {
  id: number; // 1 to 120
  hizbNumber: number; // 1 to 60
  halfPosition: 1 | 2; // 1 = 1ère moitié, 2 = 2ème moitié
  juzNumber: number; // 1 to 30
  labelFr: string;
  labelAr: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  featuredSurahNames: string;
}

export interface VerseDetail {
  numberInSurah: number;
  globalAyahNumber: number;
  textUthmani: string;
  tafsirMuyassarAr: string;
  translationFr: string;
  conciseExplanationFr: string;
  juz: number;
  hizbQuarter: number;
  audioVerseUrl: string;
}

export const ALL_SURAHS: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', nameFr: 'Al-Fatiha', meaningFr: "L'Ouverture", ayahCount: 7, revelationType: 'Mecquoise', juzStart: 1, hizbStart: 1 },
  { number: 2, nameAr: 'البقرة', nameFr: 'Al-Baqarah', meaningFr: 'La Vache', ayahCount: 286, revelationType: 'Médinoise', juzStart: 1, hizbStart: 1 },
  { number: 3, nameAr: 'آل عمران', nameFr: 'Ali \'Imran', meaningFr: 'La Famille d\'Imran', ayahCount: 200, revelationType: 'Médinoise', juzStart: 3, hizbStart: 5 },
  { number: 4, nameAr: 'النساء', nameFr: 'An-Nisa', meaningFr: 'Les Femmes', ayahCount: 176, revelationType: 'Médinoise', juzStart: 4, hizbStart: 8 },
  { number: 5, nameAr: 'المائدة', nameFr: 'Al-Ma\'idah', meaningFr: 'La Table Servie', ayahCount: 120, revelationType: 'Médinoise', juzStart: 6, hizbStart: 11 },
  { number: 6, nameAr: 'الأنعام', nameFr: 'Al-An\'am', meaningFr: 'Les Bestiaux', ayahCount: 165, revelationType: 'Mecquoise', juzStart: 7, hizbStart: 13 },
  { number: 7, nameAr: 'الأعراف', nameFr: 'Al-A\'raf', meaningFr: 'Al-A\'raf', ayahCount: 206, revelationType: 'Mecquoise', juzStart: 8, hizbStart: 16 },
  { number: 8, nameAr: 'الأنفال', nameFr: 'Al-Anfal', meaningFr: 'Le Butin', ayahCount: 75, revelationType: 'Médinoise', juzStart: 9, hizbStart: 18 },
  { number: 9, nameAr: 'التوبة', nameFr: 'At-Tawbah', meaningFr: 'Le Repentir', ayahCount: 129, revelationType: 'Médinoise', juzStart: 10, hizbStart: 19 },
  { number: 10, nameAr: 'يونس', nameFr: 'Yunus', meaningFr: 'Jonas', ayahCount: 109, revelationType: 'Mecquoise', juzStart: 11, hizbStart: 21 },
  { number: 11, nameAr: 'هود', nameFr: 'Hud', meaningFr: 'Houd', ayahCount: 123, revelationType: 'Mecquoise', juzStart: 11, hizbStart: 22 },
  { number: 12, nameAr: 'يوسف', nameFr: 'Yusuf', meaningFr: 'Joseph', ayahCount: 111, revelationType: 'Mecquoise', juzStart: 12, hizbStart: 24 },
  { number: 13, nameAr: 'الرعد', nameFr: 'Ar-Ra\'d', meaningFr: 'Le Tonnerre', ayahCount: 43, revelationType: 'Médinoise', juzStart: 13, hizbStart: 25 },
  { number: 14, nameAr: 'إبراهيم', nameFr: 'Ibrahim', meaningFr: 'Abraham', ayahCount: 52, revelationType: 'Mecquoise', juzStart: 13, hizbStart: 26 },
  { number: 15, nameAr: 'الحجر', nameFr: 'Al-Hijr', meaningFr: 'Al-Hijr', ayahCount: 99, revelationType: 'Mecquoise', juzStart: 14, hizbStart: 27 },
  { number: 16, nameAr: 'النحل', nameFr: 'An-Nahl', meaningFr: 'Les Abeilles', ayahCount: 128, revelationType: 'Mecquoise', juzStart: 14, hizbStart: 27 },
  { number: 17, nameAr: 'الإسراء', nameFr: 'Al-Isra', meaningFr: 'Le Voyage Nocturne', ayahCount: 111, revelationType: 'Mecquoise', juzStart: 15, hizbStart: 29 },
  { number: 18, nameAr: 'الكهف', nameFr: 'Al-Kahf', meaningFr: 'La Caverne', ayahCount: 110, revelationType: 'Mecquoise', juzStart: 15, hizbStart: 30 },
  { number: 19, nameAr: 'مريم', nameFr: 'Maryam', meaningFr: 'Marie', ayahCount: 98, revelationType: 'Mecquoise', juzStart: 16, hizbStart: 31 },
  { number: 20, nameAr: 'طه', nameFr: 'Ta-Ha', meaningFr: 'Ta-Ha', ayahCount: 135, revelationType: 'Mecquoise', juzStart: 16, hizbStart: 32 },
  { number: 21, nameAr: 'الأنبياء', nameFr: 'Al-Anbiya', meaningFr: 'Les Prophètes', ayahCount: 112, revelationType: 'Mecquoise', juzStart: 17, hizbStart: 33 },
  { number: 22, nameAr: 'الحج', nameFr: 'Al-Hajj', meaningFr: 'Le Pèlerinage', ayahCount: 78, revelationType: 'Médinoise', juzStart: 17, hizbStart: 34 },
  { number: 23, nameAr: 'المؤمنون', nameFr: 'Al-Mu\'minun', meaningFr: 'Les Croyants', ayahCount: 118, revelationType: 'Mecquoise', juzStart: 18, hizbStart: 35 },
  { number: 24, nameAr: 'النور', nameFr: 'An-Nur', meaningFr: 'La Lumière', ayahCount: 64, revelationType: 'Médinoise', juzStart: 18, hizbStart: 36 },
  { number: 25, nameAr: 'الفرقان', nameFr: 'Al-Furqan', meaningFr: 'Le Discernement', ayahCount: 77, revelationType: 'Mecquoise', juzStart: 18, hizbStart: 36 },
  { number: 26, nameAr: 'الشعراء', nameFr: 'Ash-Shu\'ara', meaningFr: 'Les Poètes', ayahCount: 227, revelationType: 'Mecquoise', juzStart: 19, hizbStart: 37 },
  { number: 27, nameAr: 'النمل', nameFr: 'An-Naml', meaningFr: 'Les Fourmis', ayahCount: 93, revelationType: 'Mecquoise', juzStart: 19, hizbStart: 38 },
  { number: 28, nameAr: 'القصص', nameFr: 'Al-Qasas', meaningFr: 'Le Récit', ayahCount: 88, revelationType: 'Mecquoise', juzStart: 20, hizbStart: 39 },
  { number: 29, nameAr: 'العنكبوت', nameFr: 'Al-\'Ankabut', meaningFr: 'L\'Araignée', ayahCount: 69, revelationType: 'Mecquoise', juzStart: 20, hizbStart: 40 },
  { number: 30, nameAr: 'الروم', nameFr: 'Ar-Rum', meaningFr: 'Les Romains', ayahCount: 60, revelationType: 'Mecquoise', juzStart: 21, hizbStart: 41 },
  { number: 31, nameAr: 'لقمان', nameFr: 'Luqman', meaningFr: 'Luqman', ayahCount: 34, revelationType: 'Mecquoise', juzStart: 21, hizbStart: 41 },
  { number: 32, nameAr: 'السجدة', nameFr: 'As-Sajdah', meaningFr: 'La Prosternation', ayahCount: 30, revelationType: 'Mecquoise', juzStart: 21, hizbStart: 42 },
  { number: 33, nameAr: 'الأحزاب', nameFr: 'Al-Ahzab', meaningFr: 'Les Coalisés', ayahCount: 73, revelationType: 'Médinoise', juzStart: 21, hizbStart: 42 },
  { number: 34, nameAr: 'سبأ', nameFr: 'Saba', meaningFr: 'Saba', ayahCount: 54, revelationType: 'Mecquoise', juzStart: 22, hizbStart: 43 },
  { number: 35, nameAr: 'فاطر', nameFr: 'Fatir', meaningFr: 'Le Créateur', ayahCount: 45, revelationType: 'Mecquoise', juzStart: 22, hizbStart: 44 },
  { number: 36, nameAr: 'يس', nameFr: 'Ya-Sin', meaningFr: 'Ya-Sin', ayahCount: 83, revelationType: 'Mecquoise', juzStart: 22, hizbStart: 44 },
  { number: 37, nameAr: 'الصافات', nameFr: 'As-Saffat', meaningFr: 'Les Rangés', ayahCount: 182, revelationType: 'Mecquoise', juzStart: 23, hizbStart: 45 },
  { number: 38, nameAr: 'ص', nameFr: 'Sad', meaningFr: 'Sad', ayahCount: 88, revelationType: 'Mecquoise', juzStart: 23, hizbStart: 46 },
  { number: 39, nameAr: 'الزمر', nameFr: 'Az-Zumar', meaningFr: 'Les Groupes', ayahCount: 75, revelationType: 'Mecquoise', juzStart: 23, hizbStart: 46 },
  { number: 40, nameAr: 'غافر', nameFr: 'Ghafir', meaningFr: 'Le Pardonneur', ayahCount: 85, revelationType: 'Mecquoise', juzStart: 24, hizbStart: 47 },
  { number: 41, nameAr: 'فصلت', nameFr: 'Fussilat', meaningFr: 'Les Versets Détaillés', ayahCount: 54, revelationType: 'Mecquoise', juzStart: 24, hizbStart: 48 },
  { number: 42, nameAr: 'الشورى', nameFr: 'Ash-Shura', meaningFr: 'La Consultation', ayahCount: 53, revelationType: 'Mecquoise', juzStart: 25, hizbStart: 49 },
  { number: 43, nameAr: 'الزخرف', nameFr: 'Az-Zukhruf', meaningFr: 'L\'Ornement', ayahCount: 89, revelationType: 'Mecquoise', juzStart: 25, hizbStart: 49 },
  { number: 44, nameAr: 'الدخان', nameFr: 'Ad-Dukhan', meaningFr: 'La Fumée', ayahCount: 59, revelationType: 'Mecquoise', juzStart: 25, hizbStart: 50 },
  { number: 45, nameAr: 'الجاثية', nameFr: 'Al-Jathiyah', meaningFr: 'L\'Agenouillée', ayahCount: 37, revelationType: 'Mecquoise', juzStart: 25, hizbStart: 50 },
  { number: 46, nameAr: 'الأحقاف', nameFr: 'Al-Ahqaf', meaningFr: 'Al-Ahqaf', ayahCount: 35, revelationType: 'Mecquoise', juzStart: 26, hizbStart: 51 },
  { number: 47, nameAr: 'محمد', nameFr: 'Muhammad', meaningFr: 'Muhammad', ayahCount: 38, revelationType: 'Médinoise', juzStart: 26, hizbStart: 51 },
  { number: 48, nameAr: 'الفتح', nameFr: 'Al-Fath', meaningFr: 'La Victoire Éclatante', ayahCount: 29, revelationType: 'Médinoise', juzStart: 26, hizbStart: 52 },
  { number: 49, nameAr: 'الحجرات', nameFr: 'Al-Hujurat', meaningFr: 'Les Appartements', ayahCount: 18, revelationType: 'Médinoise', juzStart: 26, hizbStart: 52 },
  { number: 50, nameAr: 'ق', nameFr: 'Qaf', meaningFr: 'Qaf', ayahCount: 45, revelationType: 'Mecquoise', juzStart: 26, hizbStart: 52 },
  { number: 51, nameAr: 'الذاريات', nameFr: 'Adh-Dhariyat', meaningFr: 'Qui Éparpillent', ayahCount: 60, revelationType: 'Mecquoise', juzStart: 26, hizbStart: 52 },
  { number: 52, nameAr: 'الطور', nameFr: 'At-Tur', meaningFr: 'Le Mont', ayahCount: 49, revelationType: 'Mecquoise', juzStart: 27, hizbStart: 53 },
  { number: 53, nameAr: 'النجم', nameFr: 'An-Najm', meaningFr: 'L\'Étoile', ayahCount: 62, revelationType: 'Mecquoise', juzStart: 27, hizbStart: 53 },
  { number: 54, nameAr: 'القمر', nameFr: 'Al-Qamar', meaningFr: 'La Lune', ayahCount: 55, revelationType: 'Mecquoise', juzStart: 27, hizbStart: 54 },
  { number: 55, nameAr: 'الرحمن', nameFr: 'Ar-Rahman', meaningFr: 'Le Tout Miséricordieux', ayahCount: 78, revelationType: 'Médinoise', juzStart: 27, hizbStart: 54 },
  { number: 56, nameAr: 'الواقعة', nameFr: 'Al-Waqi\'ah', meaningFr: 'L\'Événement', ayahCount: 96, revelationType: 'Mecquoise', juzStart: 27, hizbStart: 54 },
  { number: 57, nameAr: 'الحديد', nameFr: 'Al-Hadid', meaningFr: 'Le Fer', ayahCount: 29, revelationType: 'Médinoise', juzStart: 27, hizbStart: 54 },
  { number: 58, nameAr: 'المجادلة', nameFr: 'Al-Mujadilah', meaningFr: 'La Discussion', ayahCount: 22, revelationType: 'Médinoise', juzStart: 28, hizbStart: 55 },
  { number: 59, nameAr: 'الحشر', nameFr: 'Al-Hashr', meaningFr: 'L\'Exode', ayahCount: 24, revelationType: 'Médinoise', juzStart: 28, hizbStart: 55 },
  { number: 60, nameAr: 'الممتحنة', nameFr: 'Al-Mumtahanah', meaningFr: 'L\'Éprouvée', ayahCount: 13, revelationType: 'Médinoise', juzStart: 28, hizbStart: 55 },
  { number: 61, nameAr: 'الصف', nameFr: 'As-Saff', meaningFr: 'Le Rang', ayahCount: 14, revelationType: 'Médinoise', juzStart: 28, hizbStart: 55 },
  { number: 62, nameAr: 'الجمعة', nameFr: 'Al-Jumu\'ah', meaningFr: 'Le Vendredi', ayahCount: 11, revelationType: 'Médinoise', juzStart: 28, hizbStart: 56 },
  { number: 63, nameAr: 'المنافقون', nameFr: 'Al-Munafiqun', meaningFr: 'Les Hypocrites', ayahCount: 11, revelationType: 'Médinoise', juzStart: 28, hizbStart: 56 },
  { number: 64, nameAr: 'التغابن', nameFr: 'At-Taghabun', meaningFr: 'La Grande Perte', ayahCount: 18, revelationType: 'Médinoise', juzStart: 28, hizbStart: 56 },
  { number: 65, nameAr: 'الطلاق', nameFr: 'At-Talaq', meaningFr: 'Le Divorce', ayahCount: 12, revelationType: 'Médinoise', juzStart: 28, hizbStart: 56 },
  { number: 66, nameAr: 'التحريم', nameFr: 'At-Tahrim', meaningFr: 'L\'Interdiction', ayahCount: 12, revelationType: 'Médinoise', juzStart: 28, hizbStart: 56 },
  { number: 67, nameAr: 'الملك', nameFr: 'Al-Mulk', meaningFr: 'La Royauté', ayahCount: 30, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 57 },
  { number: 68, nameAr: 'القلم', nameFr: 'Al-Qalam', meaningFr: 'La Plume', ayahCount: 52, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 57 },
  { number: 69, nameAr: 'الحاقة', nameFr: 'Al-Haqqah', meaningFr: 'Celle qui montre la vérité', ayahCount: 52, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 57 },
  { number: 70, nameAr: 'المعارج', nameFr: 'Al-Ma\'arij', meaningFr: 'Les Voies d\'Ascension', ayahCount: 44, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 57 },
  { number: 71, nameAr: 'نوح', nameFr: 'Nuh', meaningFr: 'Noé', ayahCount: 28, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 57 },
  { number: 72, nameAr: 'الجن', nameFr: 'Al-Jinn', meaningFr: 'Les Djinns', ayahCount: 28, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 58 },
  { number: 73, nameAr: 'المزمل', nameFr: 'Al-Muzzammil', meaningFr: 'L\'Enveloppé', ayahCount: 20, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 58 },
  { number: 74, nameAr: 'المدثر', nameFr: 'Al-Muddaththir', meaningFr: 'Le Revêtu d\'un manteau', ayahCount: 56, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 58 },
  { number: 75, nameAr: 'القيامة', nameFr: 'Al-Qiyamah', meaningFr: 'La Résurrection', ayahCount: 40, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 58 },
  { number: 76, nameAr: 'الإنسان', nameFr: 'Al-Insan', meaningFr: 'L\'Homme', ayahCount: 31, revelationType: 'Médinoise', juzStart: 29, hizbStart: 58 },
  { number: 77, nameAr: 'المرسلات', nameFr: 'Al-Mursalat', meaningFr: 'Les Envoyés', ayahCount: 50, revelationType: 'Mecquoise', juzStart: 29, hizbStart: 58 },
  { number: 78, nameAr: 'النبأ', nameFr: 'An-Naba', meaningFr: 'La Nouvelle', ayahCount: 40, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 79, nameAr: 'النازعات', nameFr: 'An-Nazi\'at', meaningFr: 'Les Anges qui arrachent', ayahCount: 46, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 80, nameAr: 'عبس', nameFr: '\'Abasa', meaningFr: 'Il s\'est renfrogné', ayahCount: 42, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 81, nameAr: 'التكوير', nameFr: 'At-Takwir', meaningFr: 'L\'Obscurcissement', ayahCount: 29, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 82, nameAr: 'الانفطار', nameFr: 'Al-Infitar', meaningFr: 'La Rupture', ayahCount: 19, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 83, nameAr: 'المطففين', nameFr: 'Al-Mutaffifin', meaningFr: 'Les Fraudeurs', ayahCount: 36, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 84, nameAr: 'الانشقاق', nameFr: 'Al-Inshiqaq', meaningFr: 'La Déchirure', ayahCount: 25, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 85, nameAr: 'البروج', nameFr: 'Al-Buruj', meaningFr: 'Les Constellations', ayahCount: 22, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 86, nameAr: 'الطارق', nameFr: 'At-Tariq', meaningFr: 'L\'Astre Nocturne', ayahCount: 17, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 59 },
  { number: 87, nameAr: 'الأعلى', nameFr: 'Al-A\'la', meaningFr: 'Le Très-Haut', ayahCount: 19, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 88, nameAr: 'الغاشية', nameFr: 'Al-Ghashiyah', meaningFr: 'L\'Enveloppante', ayahCount: 26, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 89, nameAr: 'الفجر', nameFr: 'Al-Fajr', meaningFr: 'L\'Aube', ayahCount: 30, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 90, nameAr: 'البلد', nameFr: 'Al-Balad', meaningFr: 'La Cité', ayahCount: 20, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 91, nameAr: 'الشمس', nameFr: 'Ash-Shams', meaningFr: 'Le Soleil', ayahCount: 15, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 92, nameAr: 'الليل', nameFr: 'Al-Layl', meaningFr: 'La Nuit', ayahCount: 21, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 93, nameAr: 'الضحى', nameFr: 'Ad-Duha', meaningFr: 'Le Jour Montant', ayahCount: 11, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 94, nameAr: 'الشرح', nameFr: 'Ash-Sharh', meaningFr: 'L\'Ouverture', ayahCount: 8, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 95, nameAr: 'التين', nameFr: 'At-Tin', meaningFr: 'Le Figuier', ayahCount: 8, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 96, nameAr: 'العلق', nameFr: 'Al-\'Alaq', meaningFr: 'L\'Adhérence', ayahCount: 19, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 97, nameAr: 'القدر', nameFr: 'Al-Qadr', meaningFr: 'La Destinée', ayahCount: 5, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 98, nameAr: 'البينة', nameFr: 'Al-Bayyinah', meaningFr: 'La Preuve', ayahCount: 8, revelationType: 'Médinoise', juzStart: 30, hizbStart: 60 },
  { number: 99, nameAr: 'الزلزلة', nameFr: 'Az-Zalzalah', meaningFr: 'La Secousse', ayahCount: 8, revelationType: 'Médinoise', juzStart: 30, hizbStart: 60 },
  { number: 100, nameAr: 'العاديات', nameFr: 'Al-\'Adiyat', meaningFr: 'Les Coursiers', ayahCount: 11, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 101, nameAr: 'القارعة', nameFr: 'Al-Qari\'ah', meaningFr: 'Le Fracas', ayahCount: 11, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 102, nameAr: 'التكاثر', nameFr: 'At-Takathur', meaningFr: 'La Course aux richesses', ayahCount: 8, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 103, nameAr: 'العصر', nameFr: 'Al-\'Asr', meaningFr: 'Le Temps', ayahCount: 3, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 104, nameAr: 'الهمزة', nameFr: 'Al-Humazah', meaningFr: 'Les Calomniateurs', ayahCount: 9, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 105, nameAr: 'الفيل', nameFr: 'Al-Fil', meaningFr: 'L\'Éléphant', ayahCount: 5, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 106, nameAr: 'قريش', nameFr: 'Quraysh', meaningFr: 'Quraysh', ayahCount: 4, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 107, nameAr: 'الماعون', nameFr: 'Al-Ma\'un', meaningFr: 'L\'Ustensile', ayahCount: 7, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 108, nameAr: 'الكوثر', nameFr: 'Al-Kawthar', meaningFr: 'L\'Abondance', ayahCount: 3, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 109, nameAr: 'الكافرون', nameFr: 'Al-Kafirun', meaningFr: 'Les Infidèles', ayahCount: 6, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 110, nameAr: 'النصر', nameFr: 'An-Nasr', meaningFr: 'Les Secours', ayahCount: 3, revelationType: 'Médinoise', juzStart: 30, hizbStart: 60 },
  { number: 111, nameAr: 'المسد', nameFr: 'Al-Masad', meaningFr: 'Les Fibres', ayahCount: 5, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 112, nameAr: 'الإخلاص', nameFr: 'Al-Ikhlas', meaningFr: 'Le Monothéisme Pur', ayahCount: 4, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 113, nameAr: 'الفلق', nameFr: 'Al-Falaq', meaningFr: 'L\'Aube Naissante', ayahCount: 5, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
  { number: 114, nameAr: 'الناس', nameFr: 'An-Nas', meaningFr: 'Les Hommes', ayahCount: 6, revelationType: 'Mecquoise', juzStart: 30, hizbStart: 60 },
];

export const JUZ_NAMES: Record<number, { nameAr: string; nameFr: string; subtitle: string }> = {
  30: { nameAr: 'جزء عمّ', nameFr: "Juz 30 — 'Amma", subtitle: 'Sourates An-Naba (78) à An-Nas (114) · Hizb 59 & 60' },
  29: { nameAr: 'جزء تبارك', nameFr: 'Juz 29 — Tabarak', subtitle: 'Sourates Al-Mulk (67) à Al-Mursalat (77) · Hizb 57 & 58' },
  28: { nameAr: 'جزء قد سمع', nameFr: "Juz 28 — Qad Sami'", subtitle: 'Sourates Al-Mujadilah (58) à At-Tahrim (66) · Hizb 55 & 56' },
  27: { nameAr: 'جزء قال فما خطبكم', nameFr: 'Juz 27 — Qala Fama Khatbukum', subtitle: 'Sourates Adh-Dhariyat (51) à Al-Hadid (57) · Hizb 53 & 54' },
  26: { nameAr: 'جزء حم', nameFr: 'Juz 26 — Ha-Mim', subtitle: 'Sourates Al-Ahqaf (46) à Adh-Dhariyat (51) · Hizb 51 & 52' },
  25: { nameAr: 'جزء إليه يرد', nameFr: 'Juz 25 — Ilayhi Yuraddu', subtitle: 'Sourates Fussilat (41) à Al-Jathiyah (45) · Hizb 49 & 50' },
  24: { nameAr: 'جزء فمن أظلم', nameFr: 'Juz 24 — Faman Adhlamu', subtitle: 'Sourates Az-Zumar (39) à Fussilat (41) · Hizb 47 & 48' },
  23: { nameAr: 'جزء وما لي', nameFr: 'Juz 23 — Wa Ma Liya', subtitle: 'Sourates Ya-Sin (36) à Az-Zumar (39) · Hizb 45 & 46' },
  22: { nameAr: 'جزء ومن يقنت', nameFr: 'Juz 22 — Wa Man Yaqnut', subtitle: 'Sourates Al-Ahzab (33) à Ya-Sin (36) · Hizb 43 & 44' },
  21: { nameAr: 'جزء اتل ما أوحي', nameFr: 'Juz 21 — Utlu Ma Uhiya', subtitle: "Sourates Al-'Ankabut (29) à Al-Ahzab (33) · Hizb 41 & 42" },
  20: { nameAr: 'جزء أمن خلق', nameFr: 'Juz 20 — Amman Khalaqa', subtitle: "Sourates An-Naml (27) à Al-'Ankabut (29) · Hizb 39 & 40" },
  19: { nameAr: 'جزء وقال الذين', nameFr: 'Juz 19 — Wa Qala Alladhina', subtitle: 'Sourates Al-Furqan (25) à An-Naml (27) · Hizb 37 & 38' },
  18: { nameAr: 'جزء قد أفلح', nameFr: 'Juz 18 — Qad Aflaha', subtitle: "Sourates Al-Mu'minun (23) à Al-Furqan (25) · Hizb 35 & 36" },
  17: { nameAr: 'جزء اقترب للناس', nameFr: 'Juz 17 — Iqtaraba', subtitle: 'Sourates Al-Anbiya (21) à Al-Hajj (22) · Hizb 33 & 34' },
  16: { nameAr: 'جزء قال ألم', nameFr: 'Juz 16 — Qala Alam', subtitle: 'Sourates Al-Kahf (18) à Ta-Ha (20) · Hizb 31 & 32' },
  15: { nameAr: 'جزء سبحان الذي', nameFr: 'Juz 15 — Subhana Alladhi', subtitle: 'Sourates Al-Isra (17) à Al-Kahf (18) · Hizb 29 & 30' },
  14: { nameAr: 'جزء ربما', nameFr: 'Juz 14 — Rubama', subtitle: 'Sourates Al-Hijr (15) à An-Nahl (16) · Hizb 27 & 28' },
  13: { nameAr: 'جزء وما أبرئ', nameFr: "Juz 13 — Wa Ma Ubarri'u", subtitle: 'Sourates Yusuf (12) à Ibrahim (14) · Hizb 25 & 26' },
  12: { nameAr: 'جزء وما من دابة', nameFr: 'Juz 12 — Wa Ma Min Dabbah', subtitle: 'Sourates Hud (11) à Yusuf (12) · Hizb 23 & 24' },
  11: { nameAr: 'جزء يعتذرون', nameFr: "Juz 11 — Ya'tadhiruna", subtitle: 'Sourates At-Tawbah (9) à Hud (11) · Hizb 21 & 22' },
  10: { nameAr: 'جزء واعلموا', nameFr: "Juz 10 — Wa'lamu", subtitle: 'Sourates Al-Anfal (8) à At-Tawbah (9) · Hizb 19 & 20' },
  9: { nameAr: 'جزء قال الملأ', nameFr: "Juz 9 — Qala Al-Mala'u", subtitle: "Sourates Al-A'raf (7) à Al-Anfal (8) · Hizb 17 & 18" },
  8: { nameAr: 'جزء ولو أننا', nameFr: 'Juz 8 — Wa Law Annana', subtitle: "Sourates Al-An'am (6) à Al-A'raf (7) · Hizb 15 & 16" },
  7: { nameAr: 'جزء وإذا سمعوا', nameFr: "Juz 7 — Wa Idha Sami'u", subtitle: "Sourates Al-Ma'idah (5) à Al-An'am (6) · Hizb 13 & 14" },
  6: { nameAr: 'جزء لا يحب الله', nameFr: 'Juz 6 — La Yuhibbullah', subtitle: "Sourates An-Nisa (4) à Al-Ma'idah (5) · Hizb 11 & 12" },
  5: { nameAr: 'جزء والمحصنات', nameFr: 'Juz 5 — Wal-Muhsanat', subtitle: 'Sourate An-Nisa (4) · Hizb 9 & 10' },
  4: { nameAr: 'جزء لن تنالوا', nameFr: 'Juz 4 — Lan Tanalu', subtitle: "Sourates Ali 'Imran (3) à An-Nisa (4) · Hizb 7 & 8" },
  3: { nameAr: 'جزء تلك الرسل', nameFr: 'Juz 3 — Tilka Ar-Rusul', subtitle: "Sourates Al-Baqarah (2) à Ali 'Imran (3) · Hizb 5 & 6" },
  2: { nameAr: 'جزء سيقول', nameFr: 'Juz 2 — Sayaqulu', subtitle: 'Sourate Al-Baqarah (2:142–252) · Hizb 3 & 4' },
  1: { nameAr: 'جزء البسملة / الم', nameFr: 'Juz 1 — Al-Fatiha & Alif-Lam-Mim', subtitle: 'Sourates Al-Fatiha (1) à Al-Baqarah (2:141) · Hizb 1 & 2' },
};

// Detailed anchors for key Hizbs (especially Juz 30, 29, 28, 27, 26, and 1) and systematic generation for all 120 Half-Hizbs
const SPECIFIC_HALF_HIZB_OVERRIDES: Record<number, Partial<HalfHizbMeta>> = {
  // Juz 30: Hizb 59 (id 117, 118) & Hizb 60 (id 119, 120)
  117: {
    startSurah: 78, startAyah: 1, endSurah: 81, endAyah: 29,
    featuredSurahNames: 'An-Naba (78) · An-Nazi\'at (79) · \'Abasa (80) · At-Takwir (81)',
    labelFr: 'Hizb 59 · 1ère Moitié (Début Juz 30 — Sourate An-Naba)',
    labelAr: 'الحزب ٥٩ - النصف الأول (سورة النبأ - التكوير)',
  },
  118: {
    startSurah: 82, startAyah: 1, endSurah: 86, endAyah: 17,
    featuredSurahNames: 'Al-Infitar (82) · Al-Mutaffifin (83) · Al-Inshiqaq (84) · Al-Buruj (85) · At-Tariq (86)',
    labelFr: 'Hizb 59 · 2ème Moitié (Al-Infitar à At-Tariq)',
    labelAr: 'الحزب ٥٩ - النصف الثاني (سورة الانفطار - الطارق)',
  },
  119: {
    startSurah: 87, startAyah: 1, endSurah: 93, endAyah: 11,
    featuredSurahNames: 'Al-A\'la (87) · Al-Ghashiyah (88) · Al-Fajr (89) · Al-Balad (90) · Ash-Shams (91) · Al-Layl (92) · Ad-Duha (93)',
    labelFr: 'Hizb 60 · 1ère Moitié (Sourate Al-A\'la à Ad-Duha)',
    labelAr: 'الحزب ٦٠ - النصف الأول (سورة الأعلى - الضحى)',
  },
  120: {
    startSurah: 94, startAyah: 1, endSurah: 114, endAyah: 6,
    featuredSurahNames: 'Ash-Sharh (94) · At-Tin (95) · Al-\'Alaq (96) · Al-Qadr (97) … jusqu\'à An-Nas (114)',
    labelFr: 'Hizb 60 · 2ème Moitié (Ash-Sharh à An-Nas — Fin du Coran)',
    labelAr: 'الحزب ٦٠ - النصف الثاني (سورة الشرح - الناس)',
  },
  // Juz 29: Hizb 57 (id 113, 114) & Hizb 58 (id 115, 116)
  113: {
    startSurah: 67, startAyah: 1, endSurah: 68, endAyah: 52,
    featuredSurahNames: 'Al-Mulk (67) · Al-Qalam (68)',
    labelFr: 'Hizb 57 · 1ère Moitié (Début Juz 29 — Sourate Al-Mulk & Al-Qalam)',
    labelAr: 'الحزب ٥٧ - النصف الأول (سورة الملك والقلم)',
  },
  114: {
    startSurah: 69, startAyah: 1, endSurah: 71, endAyah: 28,
    featuredSurahNames: 'Al-Haqqah (69) · Al-Ma\'arij (70) · Nuh (71)',
    labelFr: 'Hizb 57 · 2ème Moitié (Al-Haqqah à Nuh)',
    labelAr: 'الحزب ٥٧ - النصف الثاني (سورة الحاقة - نوح)',
  },
  115: {
    startSurah: 72, startAyah: 1, endSurah: 74, endAyah: 56,
    featuredSurahNames: 'Al-Jinn (72) · Al-Muzzammil (73) · Al-Muddaththir (74)',
    labelFr: 'Hizb 58 · 1ère Moitié (Al-Jinn à Al-Muddaththir)',
    labelAr: 'الحزب ٥٨ - النصف الأول (سورة الجن - المدثر)',
  },
  116: {
    startSurah: 75, startAyah: 1, endSurah: 77, endAyah: 50,
    featuredSurahNames: 'Al-Qiyamah (75) · Al-Insan (76) · Al-Mursalat (77)',
    labelFr: 'Hizb 58 · 2ème Moitié (Al-Qiyamah à Al-Mursalat)',
    labelAr: 'الحزب ٥٨ - النصف الثاني (سورة القيامة - المرسلات)',
  },
  // Juz 28: Hizb 55 (id 109, 110) & Hizb 56 (id 111, 112)
  109: {
    startSurah: 58, startAyah: 1, endSurah: 59, endAyah: 10,
    featuredSurahNames: 'Al-Mujadilah (58) · Al-Hashr (59:1–10)',
    labelFr: 'Hizb 55 · 1ère Moitié (Début Juz 28 — Al-Mujadilah & Al-Hashr)',
    labelAr: 'الحزب ٥٥ - النصف الأول (سورة المجادلة والحشر)',
  },
  110: {
    startSurah: 59, startAyah: 11, endSurah: 61, endAyah: 14,
    featuredSurahNames: 'Al-Hashr (59:11–24) · Al-Mumtahanah (60) · As-Saff (61)',
    labelFr: 'Hizb 55 · 2ème Moitié (Al-Mumtahanah & As-Saff)',
    labelAr: 'الحزب ٥٥ - النصف الثاني (سورة الممتحنة والصف)',
  },
  111: {
    startSurah: 62, startAyah: 1, endSurah: 64, endAyah: 18,
    featuredSurahNames: 'Al-Jumu\'ah (62) · Al-Munafiqun (63) · At-Taghabun (64)',
    labelFr: 'Hizb 56 · 1ère Moitié (Al-Jumu\'ah à At-Taghabun)',
    labelAr: 'الحزب ٥٦ - النصف الأول (سورة الجمعة - التغابن)',
  },
  112: {
    startSurah: 65, startAyah: 1, endSurah: 66, endAyah: 12,
    featuredSurahNames: 'At-Talaq (65) · At-Tahrim (66)',
    labelFr: 'Hizb 56 · 2ème Moitié (At-Talaq & At-Tahrim)',
    labelAr: 'الحزب ٥٦ - النصف الثاني (سورة الطلاق والتحريم)',
  },
};

export function buildAllHalfHizbs(): HalfHizbMeta[] {
  const list: HalfHizbMeta[] = [];
  for (let hizb = 1; hizb <= 60; hizb++) {
    const juz = Math.ceil(hizb / 2);
    const surahsInHizb = ALL_SURAHS.filter((s) => s.hizbStart === hizb || s.juzStart === juz);
    const primarySurah = surahsInHizb[0] || ALL_SURAHS[0];
    const lastSurah = surahsInHizb[surahsInHizb.length - 1] || primarySurah;

    for (const half of [1, 2] as const) {
      const id = (hizb - 1) * 2 + half;
      const override = SPECIFIC_HALF_HIZB_OVERRIDES[id];
      const surahNames =
        override?.featuredSurahNames ||
        surahsInHizb
          .slice(0, 4)
          .map((s) => `${s.nameFr} (${s.number})`)
          .join(' · ');

      list.push({
        id,
        hizbNumber: hizb,
        halfPosition: half,
        juzNumber: juz,
        labelFr:
          override?.labelFr ||
          `Hizb ${hizb} · ${half === 1 ? '1ère Moitié' : '2ème Moitié'} (Juz ${juz})`,
        labelAr:
          override?.labelAr ||
          `الحزب ${hizb} - ${half === 1 ? 'النصف الأول' : 'النصف الثاني'}`,
        startSurah: override?.startSurah ?? primarySurah.number,
        startAyah: override?.startAyah ?? 1,
        endSurah: override?.endSurah ?? lastSurah.number,
        endAyah: override?.endAyah ?? lastSurah.ayahCount,
        featuredSurahNames: surahNames,
      });
    }
  }
  return list;
}

export const ALL_HALF_HIZBS: HalfHizbMeta[] = buildAllHalfHizbs();

/**
 * Returns the 30 Juz numbers ordered from the end of the Quran to the beginning:
 * [30, 29, 28, ..., 1] as confirmed by the user.
 */
export function getReverseJuzOrder(): number[] {
  return Array.from({ length: 30 }, (_, idx) => 30 - idx);
}

/**
 * Helper to format Yasser Al-Dosari audio URLs.
 * - Full Surah MP3: https://server11.mp3quran.net/yasser/{001..114}.mp3
 * - Verse-by-Verse MP3: https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/{001..114}{001..286}.mp3
 */
export function getYasserDosariSurahAudioUrl(surahNumber: number): string {
  const padded = String(surahNumber).padStart(3, '0');
  return `https://server11.mp3quran.net/yasser/${padded}.mp3`;
}

export function getYasserDosariVerseAudioUrl(surahNumber: number, ayahNumber: number): string {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${s}${a}.mp3`;
}

/**
 * High-precision offline seed verses for instant display (even before or without network fetch),
 * featuring Riwayat Hafs 'an 'Asim Uthmani script, Arabic Tafsir Al-Muyassar, and French explanation.
 */
export const OFFLINE_SURAH_VERSES: Record<number, VerseDetail[]> = {
  67: [
    {
      numberInSurah: 1,
      globalAyahNumber: 5242,
      textUthmani: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
      tafsirMuyassarAr: 'تعاظم وكثر خير الله الذي بيده ملك الدنيا والآخرة وسلطانهما، نافذ فيهما أمره وقضاؤه، وهو على كل شيء قدير لا يعجزه شيء.',
      translationFr: 'Béni soit Celui dans la main de Qui est la royauté, et Il est Omnipotent.',
      conciseExplanationFr: 'Affirmation de la souveraineté absolue d’Allah sur la création entière et de l’immensité de Ses bénédictions.',
      juz: 29,
      hizbQuarter: 225,
      audioVerseUrl: getYasserDosariVerseAudioUrl(67, 1),
    },
    {
      numberInSurah: 2,
      globalAyahNumber: 5243,
      textUthmani: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ',
      tafsirMuyassarAr: 'الذي خلق الموت والحياة؛ ليختبركم أيها الناس: أيكم أحسن عملا وأخلصه وأصوبه؟ وهو العزيز الذي لا يعجزه شيء، الغفور لمن تاب من عباده.',
      translationFr: 'Celui qui a créé la mort et la vie afin de vous éprouver (et de savoir) qui de vous est le meilleur en œuvre, et c’est Lui le Puissant, le Pardonneur.',
      conciseExplanationFr: 'Le but de l’existence terrestre est l’épreuve par la qualité et la sincérité des œuvres (« ahsanu \'amalan »), non leur simple quantité.',
      juz: 29,
      hizbQuarter: 225,
      audioVerseUrl: getYasserDosariVerseAudioUrl(67, 2),
    },
    {
      numberInSurah: 3,
      globalAyahNumber: 5244,
      textUthmani: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ',
      tafsirMuyassarAr: 'الذي خلق سبع سموات متطابقة بعضها فوق بعض، ما ترى في خلق الرحمن أيها الناظر من اختلاف ولا تباين، فأعد النظر إلى السماء: هل ترى فيها من شقوق أو صدوع؟',
      translationFr: 'Celui qui a créé sept cieux superposés sans que tu voies de disproportion en la création du Tout Miséricordieux. Ramène [sur elle] le regard. Y vois-tu une brèche quelconque ?',
      conciseExplanationFr: 'L’harmonie parfaite des sept cieux superposés témoigne de la science infinie du Créateur : aucune faille ni fissure n’y existe.',
      juz: 29,
      hizbQuarter: 225,
      audioVerseUrl: getYasserDosariVerseAudioUrl(67, 3),
    },
    {
      numberInSurah: 4,
      globalAyahNumber: 5245,
      textUthmani: 'ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ',
      tafsirMuyassarAr: 'ثم أعد النظر مرة بعد مرة، يرجع إليك البصر ذليلا صاغرًا عن أن يرى نقصًا، وهو كليل متعب.',
      translationFr: 'Puis, retourne ton regard à deux fois : le regard te reviendra humilié et frustré.',
      conciseExplanationFr: 'Même en scrutant l’univers à maintes reprises, le regard humain revient épuisé sans jamais trouver le moindre défaut dans l’œuvre divine.',
      juz: 29,
      hizbQuarter: 225,
      audioVerseUrl: getYasserDosariVerseAudioUrl(67, 4),
    },
    {
      numberInSurah: 5,
      globalAyahNumber: 5246,
      textUthmani: 'وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًا لِّلشَّيَٰطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ',
      tafsirMuyassarAr: 'ولقد زيَّنا السماء القريبة التي تراها العيون بنجوم عظيمة مضيئة، وجعلناها شهبًا محرقة لمسترقي السمع من الشياطين، وأعددنا لهم في الآخرة عذاب النار الموقدة.',
      translationFr: 'Nous avons effectivement embelli le ciel le plus proche avec des lampes [des étoiles] dont Nous avons fait des projectiles pour lapider des diables et Nous leur avons préparé le châtiment de la Fournaise.',
      conciseExplanationFr: 'Les étoiles remplissent une double fonction : parer la voûte céleste de lumière et protéger l’ordre céleste contre les démons.',
      juz: 29,
      hizbQuarter: 225,
      audioVerseUrl: getYasserDosariVerseAudioUrl(67, 5),
    },
  ],
  78: [
    {
      numberInSurah: 1,
      globalAyahNumber: 5673,
      textUthmani: 'عَمَّ يَتَسَآءَلُونَ',
      tafsirMuyassarAr: 'عن أيِّ شيء يسأل كفار قريش بعضهم بعضًا؟',
      translationFr: 'Sur quoi s’interrogent-ils mutuellement ?',
      conciseExplanationFr: 'Ouverture solennelle du Juz 30 (\'Amma) interpellant ceux qui doutent de la Résurrection.',
      juz: 30,
      hizbQuarter: 233,
      audioVerseUrl: getYasserDosariVerseAudioUrl(78, 1),
    },
    {
      numberInSurah: 2,
      globalAyahNumber: 5674,
      textUthmani: 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ',
      tafsirMuyassarAr: 'يتساءلون عن الخبر العظيم الشأن، وهو القرآن العظيم وما فيه من الإنباء بالبعث.',
      translationFr: 'Sur la grande nouvelle,',
      conciseExplanationFr: 'La « Grande Nouvelle » désigne le Coran et la vérité incontournable de la Résurrection après la mort.',
      juz: 30,
      hizbQuarter: 233,
      audioVerseUrl: getYasserDosariVerseAudioUrl(78, 2),
    },
    {
      numberInSurah: 3,
      globalAyahNumber: 5675,
      textUthmani: 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ',
      tafsirMuyassarAr: 'الذي هم فيه مختلفون، بين مصدِّق به ومكذِّب.',
      translationFr: 'à propos de laquelle ils divergent.',
      conciseExplanationFr: 'Les hommes se divisent face à cette révélation entre croyants convaincus et négateurs sceptiques.',
      juz: 30,
      hizbQuarter: 233,
      audioVerseUrl: getYasserDosariVerseAudioUrl(78, 3),
    },
    {
      numberInSurah: 4,
      globalAyahNumber: 5676,
      textUthmani: 'كَلَّا سَيَعْلَمُونَ',
      tafsirMuyassarAr: 'ما الأمر كما يزعم هؤلاء المشركون، سيعلمون عاقبة تكذيبهم، ويظهر لهم ما الله فاعل بهم يوم القيامة.',
      translationFr: 'Eh bien non ! Ils sauront bientôt.',
      conciseExplanationFr: 'Avertissement ferme : la réalité du Jour Dernier dissipera bientôt tout doute.',
      juz: 30,
      hizbQuarter: 233,
      audioVerseUrl: getYasserDosariVerseAudioUrl(78, 4),
    },
    {
      numberInSurah: 5,
      globalAyahNumber: 5677,
      textUthmani: 'ثُمَّ كَلَّا سَيَعْلَمُونَ',
      tafsirMuyassarAr: 'ثم سيتأكد لهم ذلك، ويتقرر عندهم صدق ما جاء به محمد صلى الله عليه وسلم من القرآن والبعث؛ وهذا تهديد ووعيد أكيد.',
      translationFr: 'Encore une fois, non ! Ils sauront bientôt.',
      conciseExplanationFr: 'Répétition d’insistance rhétorique confirmant la certitude absolue du jugement à venir.',
      juz: 30,
      hizbQuarter: 233,
      audioVerseUrl: getYasserDosariVerseAudioUrl(78, 5),
    },
  ],
  1: [
    {
      numberInSurah: 1,
      globalAyahNumber: 1,
      textUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tafsirMuyassarAr: 'أبدأ قراءتي مستعينًا بالله تعالى، متبركًا بذكر اسمه، وهو (الرحمن) ذو الرحمة العامة لجميع الخلق، (الرحيم) بالمؤمنين.',
      translationFr: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.',
      conciseExplanationFr: 'Invocation d’ouverture plaçant toute lecture et toute action sous la grâce et la miséricorde d’Allah.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 1),
    },
    {
      numberInSurah: 2,
      globalAyahNumber: 2,
      textUthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      tafsirMuyassarAr: 'الثناء الكامل وجميع المحامد لله وحده؛ لأنه رب كل شيء وخالقه ومدبره.',
      translationFr: 'Louange à Allah, Seigneur de l’univers.',
      conciseExplanationFr: 'Reconnaissance reconnaissante qu’Allah seul est le Créateur, le Maître et l’Éducateur de tous les mondes.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 2),
    },
    {
      numberInSurah: 3,
      globalAyahNumber: 3,
      textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tafsirMuyassarAr: 'الرحمن الذي وسعت رحمته جميع الخلق، الرحيم بالمؤمنين في الدنيا والآخرة.',
      translationFr: 'Le Tout Miséricordieux, le Très Miséricordieux,',
      conciseExplanationFr: 'L’autorité divine repose sur une miséricorde infinie qui englobe toute créature et récompense les croyants.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 3),
    },
    {
      numberInSurah: 4,
      globalAyahNumber: 4,
      textUthmani: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
      tafsirMuyassarAr: 'وهو سبحانه وحده مالك يوم القيامة، وهو يوم الجزاء على الأعمال.',
      translationFr: 'Maître du Jour de la rétribution.',
      conciseExplanationFr: 'Rappel de la responsabilité ultime devant le Juge suprême au Jour des Comptes.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 4),
    },
    {
      numberInSurah: 5,
      globalAyahNumber: 5,
      textUthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      tafsirMuyassarAr: 'نخصك وحدك بالعبادة، ونستعين بك وحدك في جميع أمورنا، فالأمر كله بيدك.',
      translationFr: 'C’est Toi [Seul] que nous adorons, et c’est Toi [Seul] dont nous implorons secours.',
      conciseExplanationFr: 'Le cœur du Tawhid : vouer l’adoration exclusivement à Allah et dépendre entièrement de Son aide.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 5),
    },
    {
      numberInSurah: 6,
      globalAyahNumber: 6,
      textUthmani: 'ٱهدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
      tafsirMuyassarAr: 'دلَّنا وأرشدنا، ووفقنا إلى الطريق المستقيم، وثبِّتنا عليه حتى نلقاك، وهو الإسلام.',
      translationFr: 'Guide-nous dans le droit chemin,',
      conciseExplanationFr: 'Supplication essentielle demandant à Allah la clarté de la vérité et la constance sur la voie droite.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 6),
    },
    {
      numberInSurah: 7,
      globalAyahNumber: 7,
      textUthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
      tafsirMuyassarAr: 'طريق الذين أنعمت عليهم من النبيين والصديقين والشهداء والصالحين، غير طريق المغضوب عليهم الذين عرفوا الحق وتركوه، وغير طريق الضالين الذين عبدوا الله على جهل.',
      translationFr: 'le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
      conciseExplanationFr: 'Suivre le modèle des prophètes et des véridiques en unissant la connaissance sincère à la mise en pratique fidèle.',
      juz: 1,
      hizbQuarter: 1,
      audioVerseUrl: getYasserDosariVerseAudioUrl(1, 7),
    },
  ],
};
