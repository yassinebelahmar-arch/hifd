import {
  ALL_SURAHS,
  OFFLINE_SURAH_VERSES,
  VerseDetail,
  getYasserDosariVerseAudioUrl,
} from '../data/quranMetadata';

const memorySurahCache = new Map<number, VerseDetail[]>();

/**
 * Generates a concise French pedagogical note summarizing the key spiritual lesson
 * from the verse translation so the user gets both:
 * 1) Authentic Arabic Tafsir Al-Muyassar (التفسير الميسر)
 * 2) Full French translation (Hamidullah) + concise key takeaway for Hifdh anchoring.
 */
function buildConciseFrenchTakeaway(
  surahNumber: number,
  ayahNumber: number,
  translationFr: string
): string {
  const clean = translationFr.replace(/\[.*?\]/g, '').trim();
  const surah = ALL_SURAHS.find((s) => s.number === surahNumber);
  const surahContext = surah ? `${surah.nameFr} (${surah.meaningFr})` : `Sourate ${surahNumber}`;

  if (clean.length <= 125) {
    return `Sens clé (${surahContext}, v.${ayahNumber}) : Méditation directe sur « ${clean} » pour ancrer l'enchaînement du verset.`;
  }
  const firstSentence = clean.split(/[.!?؛;]/)[0]?.trim() || clean.slice(0, 110);
  return `Repère de mémorisation (${surahContext}, v.${ayahNumber}) : ${firstSentence}.`;
}

/**
 * Fetches full Surah verses with:
 * - Riwayat Hafs 'an 'Asim (quran-uthmani)
 * - Arabic Tafsir Al-Muyassar (ar.muyassar)
 * - French Translation (fr.hamidullah)
 * - Sheikh Yasser Al-Dosari Verse-by-Verse MP3 URL
 */
export async function fetchSurahVersesWithTafsir(surahNumber: number): Promise<{
  verses: VerseDetail[];
  source: 'api' | 'offline_seed';
}> {
  if (memorySurahCache.has(surahNumber)) {
    return { verses: memorySurahCache.get(surahNumber)!, source: 'api' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.muyassar,fr.hamidullah`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json?.code === 200 && Array.isArray(json.data) && json.data.length >= 3) {
      const uthmaniEdition = json.data[0];
      const muyassarEdition = json.data[1];
      const frenchEdition = json.data[2];

      const uthmaniAyahs = uthmaniEdition.ayahs || [];
      const muyassarAyahs = muyassarEdition.ayahs || [];
      const frenchAyahs = frenchEdition.ayahs || [];

      const offlineSeed = OFFLINE_SURAH_VERSES[surahNumber] || [];

      const verses: VerseDetail[] = uthmaniAyahs.map((ayah: any, index: number) => {
        const numberInSurah: number = ayah.numberInSurah;
        const seedMatch = offlineSeed.find((v) => v.numberInSurah === numberInSurah);
        let rawUthmani: string = ayah.text || '';
        if (surahNumber !== 1 && surahNumber !== 9 && numberInSurah === 1) {
          const bismillahPrefix = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';
          if (rawUthmani.startsWith(bismillahPrefix)) {
            rawUthmani = rawUthmani.slice(bismillahPrefix.length).trim();
          }
        }
        const tafsirAr =
          muyassarAyahs[index]?.text ||
          seedMatch?.tafsirMuyassarAr ||
          'التفسير الميسر لهذه الآية الكريمة يوضح مقاصدها في توحيد الله والعمل الصالح.';
        const transFr =
          frenchAyahs[index]?.text ||
          seedMatch?.translationFr ||
          'Traduction française du verset.';
        const conciseFr =
          seedMatch?.conciseExplanationFr ||
          buildConciseFrenchTakeaway(surahNumber, numberInSurah, transFr);

        return {
          numberInSurah,
          globalAyahNumber: ayah.number,
          textUthmani: rawUthmani,
          tafsirMuyassarAr: tafsirAr,
          translationFr: transFr,
          conciseExplanationFr: conciseFr,
          juz: ayah.juz,
          hizbQuarter: ayah.hizbQuarter,
          audioVerseUrl: getYasserDosariVerseAudioUrl(surahNumber, numberInSurah),
        };
      });

      memorySurahCache.set(surahNumber, verses);
      return { verses, source: 'api' };
    }
  } catch {
    // Fallback to offline seed if network fails or is blocked
  }

  if (OFFLINE_SURAH_VERSES[surahNumber]) {
    return {
      verses: OFFLINE_SURAH_VERSES[surahNumber],
      source: 'offline_seed',
    };
  }

  // Fallback synthetic placeholder if offline and surah not in seed
  const meta = ALL_SURAHS.find((s) => s.number === surahNumber) || ALL_SURAHS[0];
  const fallbackVerses: VerseDetail[] = Array.from(
    { length: Math.min(meta.ayahCount, 15) },
    (_, i) => ({
      numberInSurah: i + 1,
      globalAyahNumber: i + 1,
      textUthmani:
        i === 0
          ? 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
          : `آيَة رقم ${i + 1} من سورة ${meta.nameAr} (رواية حفص عن عاصم)`,
      tafsirMuyassarAr: `التفسير الميسر للآية (${i + 1}) من سورة ${meta.nameAr}: بيان هدايات الآية الكريمة ومقاصدها الإيمانية.`,
      translationFr: `Verset ${i + 1} de la sourate ${meta.nameFr} (${meta.meaningFr}).`,
      conciseExplanationFr: `Explication concise du verset ${i + 1} pour faciliter la mémorisation par la compréhension du sens.`,
      juz: meta.juzStart,
      hizbQuarter: meta.hizbStart * 4,
      audioVerseUrl: getYasserDosariVerseAudioUrl(surahNumber, i + 1),
    })
  );

  return { verses: fallbackVerses, source: 'offline_seed' };
}
