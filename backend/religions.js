// The 10 traditions supported, roughly ordered by global adherent population.
// Keeping this list on the backend too so we can validate incoming requests
// and reject anything that isn't one of our supported traditions.

const RELIGIONS = {
  christianity: { name: "Christianity", scripture: "The Bible" },
  islam: { name: "Islam", scripture: "The Quran" },
  hinduism: { name: "Hinduism", scripture: "The Bhagavad Gita" },
  buddhism: { name: "Buddhism", scripture: "The Dhammapada" },
  sikhism: { name: "Sikhism", scripture: "The Guru Granth Sahib" },
  judaism: { name: "Judaism", scripture: "The Torah / Tanakh" },
  bahai: { name: "Bahá'í Faith", scripture: "The Kitáb-i-Aqdas & Writings of Bahá'u'lláh" },
  jainism: { name: "Jainism", scripture: "The Tattvartha Sutra" },
  shinto: { name: "Shinto", scripture: "The Kojiki" },
  taoism: { name: "Taoism", scripture: "The Tao Te Ching" }
};

module.exports = RELIGIONS;
