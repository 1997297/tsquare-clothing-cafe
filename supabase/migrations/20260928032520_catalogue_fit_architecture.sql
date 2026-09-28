-- Phase 1: normalized, publicly readable catalogue architecture.
-- Catalogue writes remain server/atelier-only; saved_styles keeps its existing
-- customer-owned RLS and references stable text Fit IDs.

create table public.catalogue_categories (
  slug text primary key check (slug in ('agbada', 'senator', 'kaftan', 'traditional', 'bespoke', 'formal')),
  name text not null,
  tagline text not null,
  description text not null,
  hero_image text not null,
  featured_quote text not null,
  characteristics text[] not null default '{}',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalogue_fits (
  id text primary key,
  category_slug text not null references public.catalogue_categories(slug) on update cascade,
  slug text not null unique,
  code text not null unique,
  name text not null,
  description text not null,
  long_description text,
  fabric_information text not null,
  fit_information text not null,
  occasions text[] not null default '{}',
  featured boolean not null default false,
  collection_name text not null,
  tags text[] not null default '{}',
  lead_time_weeks smallint check (lead_time_weeks between 1 and 24),
  craftsmanship_highlights text[] not null default '{}',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalogue_fit_images (
  id bigint generated always as identity primary key,
  fit_id text not null references public.catalogue_fits(id) on delete cascade,
  image_path text not null,
  alt_text text not null,
  object_position text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  source_url text,
  license_note text,
  unique (fit_id, sort_order)
);

create unique index catalogue_fit_images_one_primary
  on public.catalogue_fit_images(fit_id)
  where is_primary;

create table public.catalogue_fit_fabrics (
  id bigint generated always as identity primary key,
  fit_id text not null references public.catalogue_fits(id) on delete cascade,
  name text not null,
  description text not null,
  weight text,
  finish text,
  sort_order integer not null default 0,
  unique (fit_id, name)
);

create table public.catalogue_fit_colours (
  id bigint generated always as identity primary key,
  fit_id text not null references public.catalogue_fits(id) on delete cascade,
  name text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  unique (fit_id, name)
);

create index catalogue_fits_category_active_order
  on public.catalogue_fits(category_slug, is_active, display_order);
create index catalogue_fits_featured_active
  on public.catalogue_fits(featured, is_active)
  where featured;
create index catalogue_fit_images_fit_order
  on public.catalogue_fit_images(fit_id, sort_order);
create index catalogue_fit_fabrics_fit_order
  on public.catalogue_fit_fabrics(fit_id, sort_order);
create index catalogue_fit_colours_fit_order
  on public.catalogue_fit_colours(fit_id, sort_order);

alter table public.catalogue_categories enable row level security;
alter table public.catalogue_fits enable row level security;
alter table public.catalogue_fit_images enable row level security;
alter table public.catalogue_fit_fabrics enable row level security;
alter table public.catalogue_fit_colours enable row level security;

create policy "Public can read active catalogue categories"
  on public.catalogue_categories for select
  to anon, authenticated
  using (is_active);

create policy "Public can read active catalogue fits"
  on public.catalogue_fits for select
  to anon, authenticated
  using (is_active);

create policy "Public can read images for active fits"
  on public.catalogue_fit_images for select
  to anon, authenticated
  using (exists (
    select 1 from public.catalogue_fits
    where catalogue_fits.id = catalogue_fit_images.fit_id
      and catalogue_fits.is_active
  ));

create policy "Public can read fabrics for active fits"
  on public.catalogue_fit_fabrics for select
  to anon, authenticated
  using (exists (
    select 1 from public.catalogue_fits
    where catalogue_fits.id = catalogue_fit_fabrics.fit_id
      and catalogue_fits.is_active
  ));

create policy "Public can read colours for active fits"
  on public.catalogue_fit_colours for select
  to anon, authenticated
  using (exists (
    select 1 from public.catalogue_fits
    where catalogue_fits.id = catalogue_fit_colours.fit_id
      and catalogue_fits.is_active
  ));

grant usage on schema public to anon, authenticated;
grant select on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fit_fabrics,
  public.catalogue_fit_colours to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fit_fabrics,
  public.catalogue_fit_colours from anon, authenticated;
grant all on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fit_fabrics,
  public.catalogue_fit_colours to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into public.catalogue_categories
  (slug, name, tagline, description, hero_image, featured_quote, characteristics, display_order)
values
  ('agbada', 'Imperial Agbada', 'Architecture of African Majesty', 'A celebration of regal volume, structural integrity, and hand-embroidered discipline. Our Agbada collections balance historic grandeur with weightless, fluid wearability.', '/images/styles/agbada-imperial.jpg', 'The Agbada is not merely a garment; it is an entrance, an announcement of character and lineage.', array['Monumental silhouette with balanced drapery','Hand-guided artisanal embroidery patterns','Reinforced collars and crisp neckline contours','Custom woven 4-piece ensembles'], 1),
  ('senator', 'Executive Senator', 'Linear Precision & Quiet Authority', 'The uniform of contemporary African leaders and thinkers. Defined by immaculate shoulder lines, concealed plackets, and razor-sharp trousers.', '/images/styles/senator-executive.jpg', 'Authority does not need shouting. It reveals itself in the pitch of a shoulder and the line of a cuff.', array['Precision chest and waist darting','Minimalist concealed button plackets','High-grade tropical wools engineered for heat','Sharp flat-front trouser tapers'], 2),
  ('kaftan', 'Artisanal Kaftan', 'Effortless Grace & Tactile Luxury', 'Elongated tunics crafted from Irish linens, raw silks, and Egyptian cottons. Designed for effortless weekend elegance and intimate celebratory gatherings.', '/images/styles/kaftan-embroidered.jpg', 'Luxury experienced in motion. Relaxed yet uncompromisingly tailored.', array['Sculpted mandarin and stand collars','Breathable natural fiber compositions','Discreet side pockets and clean slit hems','Tone-on-tone artisanal stitch details'], 3),
  ('traditional', 'Heritage Roots', 'Ancestral Weaving Reimagined', 'Direct collaborations with master weavers from Western Nigeria. Integrating hand-loomed Aso-Oke, damask, and ancestral dyes into contemporary menswear.', '/images/styles/traditional-danshiki.jpg', 'We do not leave our heritage behind to be modern. We elevate our heritage until it defines modernity.', array['Direct provenance from master artisan weavers','Hand-assembled strip cloth integration','Heirloom longevity and ceremonial dignity','Custom woven family patterns upon commission'], 4),
  ('bespoke', 'Atelier Bespoke', 'Individual Geometry & Master Tailoring', 'Hand-drafted patterns cut specifically for individual posture, anatomy, and lifestyle. Full floating canvas suiting crafted without shortcuts.', '/images/styles/bespoke-double-breasted.jpg', 'A bespoke suit is not made to fit you. It is created from you.', array['Full floating horsehair canvas interior','Individual hand-drafted paper patterns','Three distinct fitting checkpoints','Finest British and Italian luxury wools'], 5),
  ('formal', 'Formal Occasion', 'Evening Drama & Black-Tie Refinement', 'From midnight dinner jackets with hand-beaded shawl collars to architectural evening suits, formalwear engineered for defining stages.', '/images/styles/formal-ivory-jacket.jpg', 'When the dress code says black tie, TSquare delivers a statement that transcends conformity.', array['Pure silk grosgrain and satin facing accents','Hand-beaded and micro-embroidered lapel options','Side-adjuster formal evening trousers','Dramatically sculpted waist suppression'], 6);

-- The Fit is the catalogue unit. Stable IDs preserve all existing saved_styles rows.
insert into public.catalogue_fits
  (id, slug, code, name, category_slug, description, long_description,
   fabric_information, fit_information, occasions, featured, collection_name,
   tags, lead_time_weeks, craftsmanship_highlights, display_order)
values
  ('tsq-agbada-024','tsq-agbada-024-imperial-grand-agbada','TSQ AGBADA 024','Imperial Grand Agbada 4-Piece','agbada','A commanding four-piece ceremonial ensemble with intricate geometric embroidery and architectural drape.','Designed for dignitaries and momentous occasions, with matching inner buba, tailored sokoto and fila.','Heavyweight virgin wool and silk blend with majestic drape.','Regal Cut: broad shoulders, wide cascading wings and tapered sokoto.',array['Groom','Traditional Wedding','Chieftaincy','State Banquet'],true,'Imperial Agbada Series',array['Agbada','Embroidery','Ceremonial','Luxury'],4,array['Artisanal chest and shoulder embroidery','Hand-rolled hems and silk pocket linings'],1),
  ('tsq-agbada-018','tsq-agbada-018-minimalist-monochrome-agbada','TSQ AGBADA 018','Minimalist Monochrome Agbada','agbada','A modern Yoruba silhouette with pristine line-work, concealed fasteners and tone-on-tone embroidery.','Quiet authority expressed through pattern precision, crisp pleats and tactile micro-texture.','Double-weave matte cashmere-cotton blend.','Modern Tailored Agbada: calibrated wing width for movement and poise.',array['Wedding Guest','Evening','Corporate Gala','Anniversary'],false,'Imperial Agbada Series',array['Agbada','Monochrome','Minimalist'],3,array['Tone-on-tone border cord work','Micro-pleated sleeve guards'],2),
  ('tsq-agbada-031','tsq-agbada-031-garnet-ceremonial-agbada','TSQ AGBADA 031','Garnet Ceremonial Agbada','agbada','A deep garnet ceremonial Agbada balanced by tonal embroidery and an assured, fluid fall.','Designed for evening celebrations and family milestones with precise ornament and generous drape.','Silk-wool damask or premium cotton jacquard.','Ceremonial Grand: generous wings, composed shoulder line and tapered sokoto.',array['Traditional Wedding','Groom','Milestone Celebration'],true,'Imperial Agbada Series',array['Agbada','Garnet','Ceremonial'],4,array['Balanced tonal chest embroidery','Hand-finished neckline and wing hems'],3),
  ('tsq-agbada-032','tsq-agbada-032-dove-grey-regent-agbada','TSQ AGBADA 032','Dove Grey Regent Agbada','agbada','A cool dove-grey Agbada with lilac undertones and dense geometric embroidery.','A pale modern palette with layered embroidery for daylight ceremony.','Lightweight wool-silk or cotton-silk brocade.','Regent Cut: stately width with an easy, balanced shoulder fall.',array['Traditional Wedding','Chieftaincy','Day Ceremony'],false,'Imperial Agbada Series',array['Agbada','Grey','Embroidery'],4,array['Geometric front-panel embroidery','Balanced layered hems'],4),
  ('tsq-senator-012','tsq-senator-012-asymmetric-placket-senator','TSQ SENATOR 012','Asymmetric Placket Executive Senator','senator','Clean architectural lines and a diagonal hidden placket deliver executive authority.','Balanced for boardrooms and evening engagements with precise chest darting.','Super 160s tropical wool with natural stretch.','Sleek Tailored: contoured chest and waist with flat-front trousers.',array['Corporate','Executive Meetings','Wedding Guest','Sunday Luxury'],true,'Executive Senator Edition',array['Senator','Executive','Tailored'],2,array['Concealed button loops','Reinforced cuff plackets'],5),
  ('tsq-senator-007','tsq-senator-007-geometric-piped-senator','TSQ SENATOR 007','Contrast Piped Heritage Senator','senator','Champagne micro-piping accents a timeless executive silhouette.','Every seam is pressed and bound with fine silk piping.','High-density English crepe wool.','Classic Executive: generous chest ease and tapered trousers.',array['Corporate','Birthday','Evening','Wedding Guest'],false,'Executive Senator Edition',array['Senator','Piping','Heritage'],2,array['Hand-inserted silk cord piping','Double back vents'],6),
  ('tsq-senator-019','tsq-senator-019-sky-blue-babban-riga-set','TSQ SENATOR 019','Sky Blue Northern Senator Set','senator','A sky-blue two-piece native set with embroidered bib and clean tapered trousers.','Poised executive native wear for long celebrations and formal daytime engagements.','Premium Shadda cotton or tropical wool.','Relaxed Executive: straight tunic, easy sleeves and tapered trousers.',array['Wedding Guest','Friday Dressing','Family Celebration'],true,'Executive Senator Edition',array['Senator','Sky Blue','Native Set'],3,array['Symmetrical bib embroidery','Hand-balanced trouser taper'],7),
  ('tsq-senator-021','tsq-senator-021-graphite-bishop-neck-set','TSQ SENATOR 021','Graphite Bishop-Neck Senator','senator','A graphite Senator set with a shallow bishop neckline and architectural lower-panel pleats.','Built around proportion rather than ornament for business and evening use.','English crepe wool or cotton-linen twill.','Modern Senator: straight torso, subtle shaping and ankle-clean trousers.',array['Corporate','Wedding Guest','Evening'],false,'Executive Senator Edition',array['Senator','Graphite','Minimalist'],3,array['Engineered lower panel','Hand-finished neckline'],8),
  ('tsq-kaftan-018','tsq-kaftan-018-embroidered-high-collar-kaftan','TSQ KAFTAN 018','Embroidered High-Collar Kaftan','kaftan','A lengthened silhouette with sculpted collar and central rib embroidery.','Refined ease with side vents engineered for effortless stride.','Irish linen and Egyptian cotton blend.','Fluid Sartorial: elongated body, relaxed shoulder and tapered trousers.',array['Everyday Luxury','Traditional Wedding','Intimate Gatherings'],true,'Artisanal Kaftan Series',array['Kaftan','Linen','Embroidery'],2,array['Artisan central threadwork','Mother-of-pearl collar studs'],9),
  ('tsq-kaftan-022','tsq-kaftan-022-silk-blend-signature-kaftan','TSQ KAFTAN 022','Silk-Blend Minimalist Robe Kaftan','kaftan','A fluid study in proportion cut from luminous silk-cotton shantung.','Pure fabric and proportion with clean pockets and evening lustre.','Silk-cotton shantung with natural slubs.','Flowing Relaxed: soft drape with structured cuffs and neckband.',array['Evening','Everyday Luxury','Destination Celebration'],false,'Artisanal Kaftan Series',array['Kaftan','Silk','Minimalist'],2,array['French-seamed construction','Concealed welt pockets'],10),
  ('tsq-kaftan-026','tsq-kaftan-026-cocoa-column-kaftan','TSQ KAFTAN 026','Cocoa Column Kaftan','kaftan','A cocoa-brown longline kaftan with a minimal collar and uninterrupted column silhouette.','A disciplined front line and warm earthen tone for evenings, travel and private celebrations.','Washed linen or cotton-silk twill.','Long Column: relaxed torso with a clean ankle-length fall.',array['Everyday Luxury','Evening','Destination Celebration'],true,'Artisanal Kaftan Series',array['Kaftan','Cocoa','Longline'],2,array['Continuous front alignment','Reinforced side-slit finishing'],11),
  ('tsq-kaftan-029','tsq-kaftan-029-burgundy-leisure-kaftan','TSQ KAFTAN 029','Burgundy Leisure Kaftan','kaftan','A saturated burgundy kaftan with a clean neckline and relaxed long silhouette.','Uncomplicated and confident with concealed finishing.','Mercerised cotton or linen-silk.','Relaxed Longline: easy shoulder and torso with side vents.',array['Everyday Luxury','Weekend','Intimate Gathering'],false,'Artisanal Kaftan Series',array['Kaftan','Burgundy','Relaxed'],2,array['Concealed side pockets','Hand-finished vent reinforcement'],12),
  ('tsq-traditional-005','tsq-traditional-005-heritage-aso-oke-tunic','TSQ TRADITIONAL 005','Heritage Aso-Oke Infused Danshiki','traditional','Handwoven Aso-Oke paneling integrated into a bespoke wool-crepe tunic.','Yoruba loom techniques reinterpreted through contemporary tailoring.','Hand-loomed Aso-Oke with British fine wool.','Heritage Fit: broad chest allowance with sculpted sleeves.',array['Traditional Wedding','Groom','Cultural Festivals','Milestone Celebrations'],true,'Heritage Roots Collection',array['Traditional','Aso-Oke','Handwoven'],4,array['Authentic handloom Aso-Oke','Hand-stabilized seams'],13),
  ('tsq-traditional-014','tsq-traditional-014-ceremonial-chieftain-set','TSQ TRADITIONAL 014','Ceremonial Chieftain 3-Piece Set','traditional','Heavyweight damask tunic with embroidered collar, trousers and ceremonial stole.','Dignified and timeless for high-status cultural occasions.','Austrian cotton brocade with silk lining.','Classic Dignitary: generous traditional drape with tailored trousers.',array['Chieftaincy','Traditional Wedding','Ceremony'],false,'Heritage Roots Collection',array['Traditional','Damask','Chieftain'],3,array['Pattern-matched brocade','Padded ceremonial neckline'],14),
  ('tsq-traditional-019','tsq-traditional-019-rose-dansiki-set','TSQ TRADITIONAL 019','Rose Heritage Dansiki Set','traditional','A rose-pink Dansiki set with an airy silhouette and graphic woven trim.','A youthful ceremonial layer grounded in classic West African proportion.','Handwoven Aso-Oke or cotton jacquard.','Open Heritage: broad body, generous sleeves and hip-length fall.',array['Cultural Festival','Traditional Wedding','Creative Gathering'],true,'Heritage Roots Collection',array['Traditional','Dansiki','Rose'],4,array['Hand-applied neckline panel','Pattern-matched front opening'],15),
  ('tsq-traditional-021','tsq-traditional-021-terracotta-longline-native','TSQ TRADITIONAL 021','Terracotta Longline Native','traditional','A terracotta longline native set with a simple round neck and restrained embroidery.','A grounded design whose length, colour and subtle front detail carry the look.','Cotton-linen or soft Shadda.','Longline Native: relaxed torso, full-length tunic and straight trousers.',array['Family Celebration','Cultural Event','Everyday Luxury'],false,'Heritage Roots Collection',array['Traditional','Terracotta','Longline'],3,array['Measured side-slit placement','Tonal chest embroidery'],16),
  ('tsq-bespoke-001','tsq-bespoke-001-double-breasted-wool-cashmere','TSQ BESPOKE 001','Sculpted Double-Breasted Wool-Cashmere','bespoke','A full-canvas 6x2 suit with wide peak lapels and rope shoulders.','Hand-drafted for individual anatomy with padded lapels and a suppressed waist.','Super 150s wool-cashmere with cupro lining.','Full Bespoke: drafted by hand to exact anatomy.',array['Groom','Black Tie','High Finance','State Dinner'],true,'Atelier Bespoke Suiting',array['Bespoke','Double-Breasted','Full Canvas'],5,array['Floating horsehair canvas','Hand-sewn Milanese buttonhole'],17),
  ('tsq-bespoke-009','tsq-bespoke-009-tuxedo-hand-beaded-lapels','TSQ BESPOKE 009','Midnight Tuxedo with Hand-Beaded Lapels','bespoke','A dramatic tuxedo with hand-beaded shawl collar.','Jet-black glass beads are sewn individually onto silk faille lapels.','British Barathea wool with duchess silk.','Bespoke Tailored: high armholes, tapered waist and high-rise trousers.',array['Groom','Black Tie','Red Carpet','Awards Gala'],false,'Atelier Bespoke Suiting',array['Bespoke','Tuxedo','Beaded'],5,array['Manual micro-bead embroidery','Silk satin trouser braids'],18),
  ('tsq-bespoke-013','tsq-bespoke-013-noir-sculpted-suit','TSQ BESPOKE 013','Noir Sculpted Single-Breasted Suit','bespoke','A sculpted black suit with lean notch lapels and precise monochrome styling.','A close bespoke fit without restricted movement.','Super 150s wool or wool-mohair.','Sculpted Bespoke: high armholes, suppressed waist and balanced sleeve pitch.',array['Wedding Guest','Corporate Gala','Evening'],true,'Atelier Bespoke Suiting',array['Bespoke','Black Suit','Full Canvas'],5,array['Floating horsehair canvas','Hand-padded lapels'],19),
  ('tsq-bespoke-016','tsq-bespoke-016-graphite-studio-suit','TSQ BESPOKE 016','Graphite Studio Suit','bespoke','A contemporary graphite suit with restrained lapels and a clean studio silhouette.','A versatile full-canvas commission expressed with understatement.','Italian worsted wool or wool-cashmere.','Contemporary Bespoke: clean shoulder and tapered trousers.',array['Corporate','Wedding Guest','Dinner Party'],false,'Atelier Bespoke Suiting',array['Bespoke','Graphite','Suit'],5,array['Individual paper pattern','Hand-felled lining'],20),
  ('tsq-formal-003','tsq-formal-003-structural-midnight-evening-suit','TSQ FORMAL 003','Structural Midnight Black Evening Suit','formal','A sharp single-breasted evening suit with sculpted waist darting.','A high stance, clean chest drape and side-adjuster trousers.','Super 130s Merino wool.','Modern Structured: clean shoulders, sculpted chest and side adjusters.',array['Evening','Corporate Gala','Wedding Guest','Dinner Party'],true,'Formal Occasion Edition',array['Formal','Evening','Two-Piece'],3,array['Hand-felled collar','Custom internal monogram'],21),
  ('tsq-formal-015','tsq-formal-015-ivory-dinner-jacket-ensemble','TSQ FORMAL 015','Ivory Dinner Jacket Ensemble','formal','A warm-ivory dinner jacket with sweeping silk grosgrain shawl lapels.','Celebratory sophistication for tropical formal evenings.','Bamboo-silk blend with cooling touch.','Contemporary Formal: soft shoulder, clean drape and satin button.',array['Groom','Black Tie Optional','Summer Gala','Milestone Celebration'],false,'Formal Occasion Edition',array['Formal','Dinner Jacket','Ivory'],3,array['Silk grosgrain shawl collar','Silk lining'],22),
  ('tsq-formal-019','tsq-formal-019-onyx-modern-evening-suit','TSQ FORMAL 019','Onyx Modern Evening Suit','formal','A confident onyx evening suit with a lean silhouette.','Concise lines and a dark palette for modern formal occasions.','Barathea wool or wool-mohair.','Modern Evening: clean chest, close waist and tapered trousers.',array['Evening','Corporate Gala','Awards Gala'],true,'Formal Occasion Edition',array['Formal','Onyx','Evening Suit'],3,array['Hand-felled collar','Silk-bound internal seams'],23),
  ('tsq-formal-021','tsq-formal-021-monochrome-textured-tuxedo','TSQ FORMAL 021','Monochrome Textured Tuxedo','formal','A black double-breasted tuxedo with broad satin lapels and a textured body.','Texture appears at close range while preserving black-tie formality.','Textured Barathea or fine wool-mohair.','Double-Breasted Evening: broad lapels, defined waist and high-rise trousers.',array['Black Tie','Groom','Awards Gala'],false,'Formal Occasion Edition',array['Formal','Tuxedo','Double-Breasted'],4,array['Hand-padded satin lapels','Pattern-matched body panels'],24);

insert into public.catalogue_fit_images
  (fit_id, image_path, alt_text, object_position, sort_order, is_primary, source_url, license_note)
values
  ('tsq-agbada-024','/images/styles/agbada-imperial.jpg','Imperial Grand Agbada full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-agbada-024','/images/styles/agbada-imperial-detail-front.jpg','Imperial Grand Agbada front embroidery detail','top',1,false,null,'Existing TCC project asset'),
  ('tsq-agbada-024','/images/styles/agbada-imperial-detail-back.jpg','Imperial Grand Agbada rear drape detail','top',2,false,null,'Existing TCC project asset'),
  ('tsq-agbada-018','/images/styles/agbada-monochrome.jpg','Minimalist Monochrome Agbada full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-agbada-031','/images/styles/agbada/agbada-garnet-031-cover.webp','Man wearing the garnet ceremonial Agbada full look','top',0,true,'https://www.pexels.com/photo/nigerian-man-in-traditional-agbada-attire-31485660/','Pexels free-to-use prototype asset'),
  ('tsq-agbada-032','/images/styles/agbada/agbada-dove-032-cover.webp','Man wearing the dove grey Regent Agbada outdoors','top',0,true,'https://www.pexels.com/photo/nigerian-man-in-traditional-agbada-outfit-outdoors-37340989/','Pexels free-to-use prototype asset'),
  ('tsq-senator-012','/images/styles/senator-executive.jpg','Asymmetric Placket Executive Senator full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-senator-007','/images/styles/senator-heritage.jpg','Contrast Piped Heritage Senator full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-senator-019','/images/styles/senator/senator-adire-earth-019-cover.jpg','Full-length sky blue Northern Senator set','top',0,true,'https://dejiandkola.com/','Temporary development reference; replace with commissioned TCC photography'),
  ('tsq-senator-021','/images/styles/senator/senator-sapphire-021-cover.jpg','Full-length graphite bishop-neck Senator set','top',0,true,'https://www.blokesanddivas.com/','Temporary development reference; replace with commissioned TCC photography'),
  ('tsq-kaftan-018','/images/styles/kaftan-embroidered.jpg','Embroidered High-Collar Kaftan full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-kaftan-022','/images/styles/kaftan-silk.jpg','Silk-Blend Minimalist Robe Kaftan full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-kaftan-026','/images/styles/kaftan/kaftan-cocoa-026-cover.webp','Man wearing the cocoa column kaftan','top',0,true,'https://www.pexels.com/photo/modern-portrait-of-man-in-traditional-nigerian-kaftan-38188493/','Pexels free-to-use prototype asset'),
  ('tsq-kaftan-029','/images/styles/kaftan/kaftan-burgundy-029-cover.webp','Man wearing the burgundy leisure kaftan outdoors','top',0,true,'https://www.pexels.com/photo/man-in-traditional-nigerian-attire-with-cap-and-sunglasses-37766348/','Pexels free-to-use prototype asset'),
  ('tsq-traditional-005','/images/styles/traditional-danshiki.jpg','Heritage Aso-Oke Infused Danshiki full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-traditional-014','/images/styles/traditional-chieftain.jpg','Ceremonial Chieftain three-piece full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-traditional-019','/images/styles/traditional/dansiki-rose-019-cover.webp','Man wearing the rose heritage Dansiki set','top',0,true,'https://www.pexels.com/photo/traditional-nigerian-attire-on-stylish-young-man-36796646/','Pexels free-to-use prototype asset'),
  ('tsq-traditional-021','/images/styles/traditional/dansiki-ochre-021-cover.jpg','Two men wearing terracotta longline native sets','70% center',0,true,'https://www.pexels.com/photo/29133970/','Pexels free-to-use prototype asset'),
  ('tsq-bespoke-001','/images/styles/bespoke-double-breasted.jpg','Sculpted Double-Breasted Wool-Cashmere full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-bespoke-009','/images/styles/bespoke-tuxedo.jpg','Midnight Tuxedo with Hand-Beaded Lapels full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-bespoke-013','/images/styles/bespoke/bespoke-noir-013-cover.webp','Portrait of the noir sculpted single-breasted suit','top',0,true,'https://www.pexels.com/photo/27117681/','Pexels free-to-use prototype asset'),
  ('tsq-bespoke-016','/images/styles/bespoke/bespoke-graphite-016-cover.webp','Portrait of the graphite studio suit','top',0,true,'https://www.pexels.com/photo/17492492/','Pexels free-to-use prototype asset'),
  ('tsq-formal-003','/images/styles/formal-evening.jpg','Structural Midnight Black Evening Suit full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-formal-015','/images/styles/formal-ivory-jacket.jpg','Ivory Dinner Jacket Ensemble full look','top',0,true,null,'Existing TCC project asset'),
  ('tsq-formal-019','/images/styles/formal/formal-onyx-019-cover.webp','Man wearing the onyx modern evening suit','top',0,true,'https://www.pexels.com/photo/13908561/','Pexels free-to-use prototype asset'),
  ('tsq-formal-021','/images/styles/formal/formal-monochrome-021-cover.jpg','Man wearing the monochrome textured tuxedo','top',0,true,'https://www.pexels.com/photo/elegant-portrait-of-man-in-black-tuxedo-37263584/','Pexels free-to-use prototype asset');

-- Two category-appropriate textile choices are stored as relations for every Fit.
insert into public.catalogue_fit_fabrics (fit_id, name, description, weight, finish, sort_order)
select f.id, seed.name, seed.description, seed.weight, seed.finish, seed.sort_order
from public.catalogue_fits f
join (values
  ('agbada','Silk-Wool Damask','Structured ceremonial weave with dignified drape.','Medium-heavy','Tonal lustre',0),
  ('agbada','Premium Cotton Jacquard','Breathable woven cotton suited to embroidery.','Medium','Matte jacquard',1),
  ('senator','Tropical Wool','Fine worsted wool with resilient crease recovery.','Light','Matte',0),
  ('senator','Premium Shadda Cotton','Crisp breathable cotton for clean native tailoring.','Medium','Subtle sheen',1),
  ('kaftan','Washed Irish Linen','Breathable linen softened for a fluid fall.','Medium-light','Natural matte',0),
  ('kaftan','Silk-Cotton Shantung','Light cloth with organic slubs and quiet lustre.','Light','Soft lustre',1),
  ('traditional','Handwoven Aso-Oke','Artisan strip cloth with individual texture.','Medium-heavy','Handwoven',0),
  ('traditional','Cotton Jacquard','A lighter woven option for warm ceremonies.','Medium','Textured matte',1),
  ('bespoke','Super 150s Worsted Wool','Fine wool for a responsive tailored line.','Medium','Matte',0),
  ('bespoke','Wool-Mohair','Crisp resilient cloth with evening brilliance.','Medium-light','Dry lustre',1),
  ('formal','British Barathea Wool','Classic evening wool with a rich surface.','Medium-heavy','Matte',0),
  ('formal','Fine Wool-Mohair','Crisp formal cloth with elegant recovery.','Medium','Dry sheen',1)
) as seed(category_slug, name, description, weight, finish, sort_order)
  on seed.category_slug = f.category_slug;

-- Fit-specific lead colours, followed by two category alternatives.
insert into public.catalogue_fit_colours (fit_id, name, hex, sort_order)
values
  ('tsq-agbada-024','Obsidian Black','#11110F',0),('tsq-agbada-018','Pure Sandstone','#A79C8C',0),('tsq-agbada-031','Garnet','#6F1D2C',0),('tsq-agbada-032','Dove Grey','#AAA5AA',0),
  ('tsq-senator-012','Midnight Charcoal','#1C1F22',0),('tsq-senator-007','Espresso Brown','#30251F',0),('tsq-senator-019','Sky Blue','#A7C8E5',0),('tsq-senator-021','Graphite','#6F7074',0),
  ('tsq-kaftan-018','Warm Ivory','#F3EFE7',0),('tsq-kaftan-022','Champagne Sand','#C7B9A3',0),('tsq-kaftan-026','Cocoa','#5B3A29',0),('tsq-kaftan-029','Burgundy','#681F2B',0),
  ('tsq-traditional-005','Indigo Heritage','#1D2D44',0),('tsq-traditional-014','Imperial Cream','#E2D3B3',0),('tsq-traditional-019','Dusty Rose','#C07A82',0),('tsq-traditional-021','Terracotta','#A54F37',0),
  ('tsq-bespoke-001','Near Black Midnight','#11110F',0),('tsq-bespoke-009','True Midnight Navy','#0E1524',0),('tsq-bespoke-013','Noir','#101010',0),('tsq-bespoke-016','Graphite','#3F4246',0),
  ('tsq-formal-003','Midnight Black','#11110F',0),('tsq-formal-015','Warm Ivory','#F3EFE7',0),('tsq-formal-019','Onyx','#11110F',0),('tsq-formal-021','Black','#0B0B0B',0);

insert into public.catalogue_fit_colours (fit_id, name, hex, sort_order)
select f.id, seed.name, seed.hex, seed.sort_order
from public.catalogue_fits f
join (values
  ('agbada','Midnight Navy','#131C2E',1),('agbada','Raw Ivory','#F3EFE7',2),
  ('senator','Bespoke Navy','#182238',1),('senator','Warm Taupe','#8C8275',2),
  ('kaftan','Espresso','#30251F',1),('kaftan','Smoked Sage','#7C887A',2),
  ('traditional','Obsidian','#11110F',1),('traditional','Raw Ecru','#DCD5C6',2),
  ('bespoke','Ink Navy','#121A2E',1),('bespoke','Vintage Wine','#3B1820',2),
  ('formal','Midnight Navy','#0E1524',1),('formal','Smoky Charcoal','#22252A',2)
) as seed(category_slug, name, hex, sort_order)
  on seed.category_slug = f.category_slug
where not exists (
  select 1 from public.catalogue_fit_colours existing
  where existing.fit_id = f.id and existing.name = seed.name
);
