/**
 * Testlerde ortak kullanılan örnek makale — denetimlerin tamamını geçecek kadar sağlıklı
 * (600+ kelime, 3+ ara başlık, liste, 2 iç bağlantı, odak kelime başlıkta/adreste/girişte).
 * Bir denetimin bozulduğunu göstermek isteyen test bunu tek noktadan bozar.
 */
export const GOOD_BODY = [
  "Kira artışı, kiracı ile ev sahibi arasındaki en sık uyuşmazlık konusudur. Bu yazıda kira artışının nasıl hesaplandığını, hangi sınırların geçerli olduğunu ve itiraz yolunun nasıl işlediğini anlatıyoruz. Amacımız, hukukçu olmayan bir okuyucunun da süreci adım adım anlayabilmesi ve masaya oturduğunda haklarını bilmesi.",

  "## Kira artışı nasıl hesaplanır?",
  "Hesaplama, sözleşmede kararlaştırılan orana ve kanunda öngörülen üst sınıra göre yapılır. Taraflar sözleşmede bir oran belirlemişse önce ona bakılır. Ancak bu oran kanuni sınırın üzerindeyse, aşan kısım talep edilemez. Kiracı bu sınırın üzerindeki talebe itiraz edebilir. Ev sahibi de artışı yazılı olarak bildirmek zorundadır; sözlü bildirim uyuşmazlık hâlinde ispat sorunu yaratır.",
  "Uygulamada en sık karşılaşılan hata, artışın sözleşme yenilenmeden uygulanmaya çalışılmasıdır. Kira dönemi dolmadan tek taraflı artış yapılamaz. Dönem sonunda yapılan artış ise yeni dönemin başlangıcından itibaren geçerli olur.",
  "- Sözleşmedeki oran esas alınır",
  "- Kanuni üst sınır aşılamaz",
  "- Bildirim yazılı yapılmalıdır",
  "- Artış yeni dönem başında uygulanır",

  "## Ev sahibi daha fazlasını isterse ne olur?",
  "Ev sahibinin kanuni sınırın üzerinde bir artış talep etmesi, tek başına sözleşmeyi geçersiz kılmaz. Kiracı, aşan kısmı ödemek zorunda değildir; ödediği takdirde ise sebepsiz zenginleşme hükümlerine dayanarak geri isteyebilir. Bu noktada ödeme belgelerinin saklanması belirleyici olur.",
  "Tarafların anlaşamaması hâlinde kira tespit davası gündeme gelir. Bu dava, kiranın rayiç bedele göre yeniden belirlenmesini sağlar. Mahkeme bilirkişi incelemesi yaptırır ve bölgedeki benzer taşınmazların kira bedellerini karşılaştırır.",

  "### İtiraz yolu ve süreler",
  "İtiraz için sulh hukuk mahkemesine başvurulur. Süreçte kira sözleşmesi, ödeme belgeleri ve varsa yazışmalar önem taşır. Dava açmadan önce arabuluculuğa başvurulması gereken hâller bulunur; bu adım atlanırsa dava usulden reddedilebilir.",
  "Belge toplarken banka dekontlarına özellikle dikkat edin: açıklama kısmına hangi aya ait olduğu yazılmış ödemeler, ispat açısından çok daha güçlüdür. [Kira hukuku](/calisma-alanlari/kira-hukuku) ve [gayrimenkul hukuku](/calisma-alanlari/gayrimenkul-hukuku) sayfalarımızda süreci daha ayrıntılı anlattık.",

  "## Kiracı olarak nelere dikkat etmelisiniz?",
  "Sözleşmeyi imzalamadan önce artış maddesini mutlaka okuyun. Belirsiz ifadeler ileride sizin aleyhinize yorumlanabilir. Artışın hangi ölçüte bağlandığı açıkça yazılmalıdır. Ayrıca depozitonun iadesi, tadilat sorumluluğu ve ortak gider paylaşımı da aynı titizlikle ele alınmalıdır.",
  "Tahliye tehdidiyle karşılaşırsanız paniğe kapılmayın. Geçerli bir tahliye sebebi olmadan, yalnızca artışı kabul etmediğiniz için tahliye edilemezsiniz. Kanun, kiracıyı bu yönde koruyan açık düzenlemeler içerir.",

  "## Kira tespit davası ne zaman açılır?",
  "Kira tespit davası, tarafların bedelde anlaşamaması hâlinde başvurulan yoldur. Dava, yeni dönemin başlangıcından önce açılırsa hüküm o dönemden itibaren sonuç doğurur. Sonra açılması hâlinde ise etkisi bir sonraki döneme kayabilir; bu nedenle zamanlama, davanın kendisi kadar önemlidir.",
  "Mahkeme, bölgedeki benzer taşınmazların bedellerini karşılaştırmak için bilirkişi görevlendirir. Bilirkişi raporunda taşınmazın konumu, yaşı, kullanım alanı ve genel durumu değerlendirilir. Rapora itiraz etmek mümkündür; itirazın gerekçeli olması ve somut karşılaştırma verileri içermesi beklenir.",
  "Sürecin uzunluğu, mahkemenin iş yüküne ve bilirkişi incelemesinin süresine bağlı olarak değişir. Bu süre boyunca kiracı mevcut bedeli ödemeye devam eder; karar kesinleştiğinde aradaki fark geriye dönük olarak hesaplanır.",

  "## Sık yapılan hatalar",
  "Uygulamada en çok karşılaşılan hata, tarafların yazışmaları saklamamasıdır. Telefonda yapılan görüşmeler, uyuşmazlık büyüdüğünde hiçbir işe yaramaz. İkinci sık hata, ödemelerin elden yapılması ve belgelendirilmemesidir. Üçüncüsü ise sözleşmenin hiç okunmadan imzalanmasıdır.",
  "Bir diğer yaygın yanılgı, ev sahibinin her dönem istediği oranda artış yapabileceği düşüncesidir. Bu doğru değildir ve kiracının bu konuda bilgi sahibi olması, gereksiz bir uyuşmazlığın önüne geçer.",

  "### Sözleşmede dikkat edilecek maddeler",
  "Artış maddesinin yanı sıra, kira bedelinin hangi hesaba ve hangi tarihte yatırılacağı da açıkça yazılmalıdır. Ödeme gününün belirsiz bırakılması, gecikme iddialarına zemin hazırlar. Aynı şekilde, taşınmazda yapılacak tadilatların kimin sorumluluğunda olduğu ve masrafın nasıl paylaşılacağı da sözleşmede yer almalıdır.",
  "Depozitonun iadesi konusu çoğu uyuşmazlığın kaynağıdır. Taşınma sırasında tutulacak bir teslim tutanağı, taşınmazın hangi durumda teslim edildiğini belgelendirir ve sonradan çıkacak tartışmaların büyük bölümünü baştan önler. Tutanağa fotoğraf eklenmesi ayrıca yararlıdır.",

  "## Sonuç",
  "Kira artışı tartışması çoğu zaman iletişimle çözülür. Yine de haklarınızı bilmek, masaya güçlü oturmanızı sağlar. Sözleşmenizi saklayın, ödemelerinizi belgeleyin ve gerektiğinde bir avukata danışın. Bu yazı genel bilgilendirme amaçlıdır; somut durumunuz için hukuki danışmanlık alın.",
].join("\n\n");

export const GOOD_INPUT = {
  title: "Kira artışı nasıl hesaplanır?",
  slug: "kira-artisi-nasil-hesaplanir",
  body: GOOD_BODY,
  excerpt:
    "Kira artışının nasıl hesaplandığını, kanuni üst sınırı ve itiraz yolunu sade bir dille anlatıyoruz.",
  metaTitle: "Kira artışı nasıl hesaplanır? Sınırlar ve itiraz",
  metaDescription:
    "Kira artışının nasıl hesaplandığını, kanuni üst sınırı ve itiraz yolunu hukukçu olmayanlar için sade bir dille anlatıyoruz.",
  focusKeyword: "kira artışı",
  baseUrl: "https://yakahukuk.com",
  pathPrefix: "/makaleler",
  faqCount: 4,
  hasAuthor: true,
};
