import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Users, Trophy, Clock, Volume2, ChevronLeft, User, Trash2, Sparkles, CheckCircle2, Loader2, Gauge, Zap, Star, LogOut, Home, Search, Globe, Target, ShieldCheck, Eye, Layers, Palette, Monitor, SkipForward } from 'lucide-react';
import { ProAvatar } from './ProAvatar';
import { ChatUser } from '../types';
import { chatService } from '../services/chatService';
import { leaderboardService } from '../services/supabase';

interface LogoRoundProps {
    onHome: () => void;
    isOBS?: boolean;
}

interface GameConfig {
    joinKeyword: string;
    maxPlayers: number;
    roundDuration: number;
    // isBlurred removed/ignored - always clear
    autoProgress: boolean;
    totalRounds: number;
    // New aesthetic settings
    showHints: boolean;
    difficulty: 'Easy' | 'Hard';
    soundEffects: boolean;
    streamerMode: boolean;
}

type GamePhase = 'SETUP' | 'LOBBY' | 'PLAYING' | 'REVEAL' | 'FINALE';

interface Brand {
    name: string;
    domain: string;
    aliases: string[];
}

const POPULAR_BRANDS: Brand[] = [
    { name: 'Half Million', domain: 'halfmillion.co', aliases: ["هاف مليون","Half Million","half million","هافمليون"] },
    { name: 'Barns', domain: 'barns.com.sa', aliases: ["بارنز","Barns","barns"] },
    { name: 'Albaik', domain: 'albaik.com', aliases: ["البيك","Albaik","albaik"] },
    { name: 'McDonalds KSA', domain: 'mcdonalds.com', aliases: ["ماكدونالدز السعودية","McDonalds KSA","mcdonalds ksa","ماكدونالدزالسعودية"] },
    { name: 'KFC', domain: 'kfc.me', aliases: ["كنتاكي","KFC","kfc"] },
    { name: 'Shawarmer', domain: 'shawarmer.com', aliases: ["شاورمر","Shawarmer","shawarmer"] },
    { name: 'Maestro Pizza', domain: 'maestropizza.com', aliases: ["مايسترو بيتزا","Maestro Pizza","maestro pizza","مايستروبيتزا"] },
    { name: 'Herfy', domain: 'herfy.com', aliases: ["هرفي","Herfy","herfy"] },
    { name: 'Kudu', domain: 'kudu.com.sa', aliases: ["كودو","Kudu","kudu"] },
    { name: 'Jahez', domain: 'jahez.net', aliases: ["جاهز","Jahez","jahez"] },
    { name: 'Hungerstation', domain: 'hungerstation.com', aliases: ["هنقرستيشن","Hungerstation","hungerstation"] },
    { name: 'Mrsool', domain: 'mrsool.co', aliases: ["مرسول","Mrsool","mrsool"] },
    { name: 'ToYou', domain: 'toyou.io', aliases: ["تويو","ToYou","toyou"] },
    { name: 'Noon', domain: 'noon.com', aliases: ["نون","Noon","noon"] },
    { name: 'Amazon SA', domain: 'amazon.sa', aliases: ["أمازون السعودية","Amazon SA","amazon sa","أمازونالسعودية"] },
    { name: 'Jarir Bookstore', domain: 'jarir.com', aliases: ["جرير","Jarir Bookstore","jarir bookstore"] },
    { name: 'eXtra', domain: 'extra.com', aliases: ["إكسترا","eXtra","extra"] },
    { name: 'Nahdi Pharmacy', domain: 'nahdionline.com', aliases: ["صيدلية النهدي","Nahdi Pharmacy","nahdi pharmacy","صيدليةالنهدي"] },
    { name: 'Al-Dawaa', domain: 'al-dawaa.com', aliases: ["صيدلية الدواء","Al-Dawaa","al-dawaa","صيدليةالدواء"] },
    { name: 'Starbucks', domain: 'starbucks.sa', aliases: ["ستاربكس","Starbucks","starbucks"] },
    { name: 'Dunkin', domain: 'dunkindonuts.sa', aliases: ["دانكن","Dunkin","dunkin"] },
    { name: 'Burger King', domain: 'burgerking.com.sa', aliases: ["برجر كنج","Burger King","burger king","برجركنج"] },
    { name: 'Hardees', domain: 'hardees.com.sa', aliases: ["هارديز","Hardees","hardees"] },
    { name: 'Pizza Hut', domain: 'pizzahut.com.sa', aliases: ["بيتزا هت","Pizza Hut","pizza hut","بيتزاهت"] },
    { name: 'Dominos', domain: 'dominos.com.sa', aliases: ["دومينوز بيتزا","Dominos","dominos","دومينوزبيتزا"] },
    { name: 'stc', domain: 'stc.com.sa', aliases: ["إس تي سي","stc","إستي سي"] },
    { name: 'Mobily', domain: 'mobily.com.sa', aliases: ["موبايلي","Mobily","mobily"] },
    { name: 'Zain', domain: 'sa.zain.com', aliases: ["زين","Zain","zain"] },
    { name: 'Jawwy', domain: 'jawwy.sa', aliases: ["جوي","Jawwy","jawwy"] },
    { name: 'Virgin Mobile', domain: 'virginmobile.sa', aliases: ["فرجن موبايل","Virgin Mobile","virgin mobile","فرجنموبايل"] },
    { name: 'Al Rajhi Bank', domain: 'alrajhibank.com.sa', aliases: ["مصرف الراجحي","Al Rajhi Bank","al rajhi bank","مصرفالراجحي"] },
    { name: 'SNB', domain: 'alahli.com', aliases: ["البنك الأهلي السعودي","SNB","snb","البنكالأهلي السعودي"] },
    { name: 'Alinma Bank', domain: 'alinma.com', aliases: ["بنك الإنماء","Alinma Bank","alinma bank","بنكالإنماء"] },
    { name: 'Riyad Bank', domain: 'riyadbank.com', aliases: ["بنك الرياض","Riyad Bank","riyad bank","بنكالرياض"] },
    { name: 'Bank Albilad', domain: 'bankalbilad.com', aliases: ["بنك البلاد","Bank Albilad","bank albilad","بنكالبلاد"] },
    { name: 'SAB', domain: 'sab.com', aliases: ["البنك السعودي الأول","SAB","sab","البنكالسعودي الأول"] },
    { name: 'stc pay', domain: 'stcpay.com.sa', aliases: ["إس تي سي باي","stc pay","إستي سي باي"] },
    { name: 'urpay', domain: 'urpay.com.sa', aliases: ["يورباي","urpay"] },
    { name: 'Almarai', domain: 'almarai.com', aliases: ["المراعي","Almarai","almarai"] },
    { name: 'Nadec', domain: 'nadec.com.sa', aliases: ["نادك","Nadec","nadec"] },
    { name: 'Al Safi', domain: 'alsafi.com.sa', aliases: ["الصافي","Al Safi","al safi"] },
    { name: 'Panda', domain: 'panda.com.sa', aliases: ["بندة","Panda","panda"] },
    { name: 'Al Othaim', domain: 'othaimmarkets.com', aliases: ["العثيم","Al Othaim","al othaim"] },
    { name: 'Danube', domain: 'danubeco.com', aliases: ["الدنوب","Danube","danube"] },
    { name: 'BinDawood', domain: 'bindawood.com', aliases: ["بن داود","BinDawood","bindawood","بنداود"] },
    { name: 'Tamimi Markets', domain: 'tamimimarkets.com', aliases: ["أسواق التميمي","Tamimi Markets","tamimi markets","أسواقالتميمي"] },
    { name: 'Lulu Hypermarket', domain: 'luluhypermarket.com', aliases: ["لولو هايبرماركت","Lulu Hypermarket","lulu hypermarket","لولوهايبرماركت"] },
    { name: 'Carrefour SA', domain: 'carrefoursaudi.com', aliases: ["كارفور السعودية","Carrefour SA","carrefour sa","كارفورالسعودية"] },
    { name: 'Hamburgini', domain: 'hamburgini.com', aliases: ["هامبرغيني","Hamburgini","hamburgini"] },
    { name: 'Signature', domain: 'signaturejuice.com', aliases: ["سيجنتشر","Signature","signature"] },
    { name: 'Overdose', domain: 'overdosecoffeeco.com', aliases: ["اوفر دوز","Overdose","overdose","اوفردوز"] },
    { name: 'Key Cafe', domain: 'keycafe.sa', aliases: ["كيه كافيه","Key Cafe","key cafe","كيهكافيه"] },
    { name: 'Dose Cafe', domain: 'dosecafe.com', aliases: ["دوز كافيه","Dose Cafe","dose cafe","دوزكافيه"] },
    { name: '% Arabica', domain: 'arabicacoffee.ae', aliases: ["أربيكا","% Arabica","% arabica"] },
    { name: 'Caribou Coffee', domain: 'cariboucoffee.com', aliases: ["كيربو كافيه","Caribou Coffee","caribou coffee","كيربوكافيه"] },
    { name: 'Costa Coffee', domain: 'costacoffee.sa', aliases: ["كوستا كافيه","Costa Coffee","costa coffee","كوستاكافيه"] },
    { name: 'Saudia', domain: 'saudia.com', aliases: ["الخطوط السعودية","Saudia","saudia","الخطوطالسعودية"] },
    { name: 'flyadeal', domain: 'flyadeal.com', aliases: ["طيران أديل","flyadeal","طيرانأديل"] },
    { name: 'flynas', domain: 'flynas.com', aliases: ["طيران ناس","flynas","طيرانناس"] },
    { name: 'Riyadh Air', domain: 'riyadhair.com', aliases: ["طيران الرياض","Riyadh Air","riyadh air","طيرانالرياض"] },
    { name: 'Almosafer', domain: 'almosafer.com', aliases: ["المسافر","Almosafer","almosafer"] },
    { name: 'Wego', domain: 'wego.com', aliases: ["ويجو","Wego","wego"] },
    { name: 'Careem', domain: 'careem.com', aliases: ["كريم","Careem","careem"] },
    { name: 'Uber', domain: 'uber.com', aliases: ["أوبر","Uber","uber"] },
    { name: 'Bolt', domain: 'bolt.eu', aliases: ["بولت","Bolt","bolt"] },
    { name: 'Aldrees', domain: 'aldrees.com', aliases: ["الدريس","Aldrees","aldrees"] },
    { name: 'SASCO', domain: 'sasco.com.sa', aliases: ["ساسكو","SASCO","sasco"] },
    { name: 'Sahel', domain: 'sahelenergy.com', aliases: ["سهل","Sahel","sahel"] },
    { name: 'Naft', domain: 'naft.com.sa', aliases: ["نفت","Naft","naft"] },
    { name: 'Chef\'s', domain: 'chefsburger.com', aliases: ["شيفز","Chef's","chef's"] },
    { name: 'Section-B', domain: 'sectionb-sa.com', aliases: ["سكشن بي","Section-B","section-b","سكشنبي"] },
    { name: 'Cinnabon', domain: 'cinnabon.com', aliases: ["سينيبون","Cinnabon","cinnabon"] },
    { name: 'Saadeddin Pastry', domain: 'saadeddin.com', aliases: ["سعد الدين","Saadeddin Pastry","saadeddin pastry","سعدالدين"] },
    { name: 'Patchi', domain: 'patchi.com', aliases: ["باتشي","Patchi","patchi"] },
    { name: 'Bateel', domain: 'bateel.com', aliases: ["بتيل","Bateel","bateel"] },
    { name: 'Godiva', domain: 'godivagulf.com', aliases: ["جودايفا","Godiva","godiva"] },
    { name: 'Danube Home', domain: 'danubehome.com', aliases: ["دانوب هوم","Danube Home","danube home","دانوبهوم"] },
    { name: 'Nice One', domain: 'niceone.com', aliases: ["نايس ون","Nice One","nice one","نايسون"] },
    { name: 'Golden Scent', domain: 'goldenscent.com', aliases: ["قولدن سنت","Golden Scent","golden scent","قولدنسنت"] },
    { name: 'Namshi', domain: 'namshi.com', aliases: ["نمشي","Namshi","namshi"] },
    { name: 'Styli', domain: 'stylishop.com', aliases: ["ستايلى","Styli","styli"] },
    { name: 'Centrepoint', domain: 'centrepointstores.com', aliases: ["سنتربوينت","Centrepoint","centrepoint"] },
    { name: 'Max Fashion', domain: 'maxfashion.com', aliases: ["ماكس فاشن","Max Fashion","max fashion","ماكسفاشن"] },
    { name: 'Splash', domain: 'splashfashions.com', aliases: ["سبلاش","Splash","splash"] },
    { name: 'H&M', domain: 'hm.com', aliases: ["إتش أند إم","H&M","h&m","إتشأند إم"] },
    { name: 'Zara', domain: 'zara.com', aliases: ["زارا","Zara","zara"] },
    { name: 'IKEA', domain: 'ikea.com.sa', aliases: ["إيكيا","IKEA","ikea"] },
    { name: 'SACO', domain: 'saco-sa.com', aliases: ["ساكو","SACO","saco"] },
    { name: 'Abyat', domain: 'abyat.com', aliases: ["أبيات","Abyat","abyat"] },
    { name: 'Buffalo Wild Wings', domain: 'buffalowildwings.sa', aliases: ["بافلو وايلد وينجز","Buffalo Wild Wings","buffalo wild wings","بافلووايلد وينجز"] },
    { name: 'Texas Roadhouse', domain: 'texasroadhouse.com.sa', aliases: ["تكساس رودهاوس","Texas Roadhouse","texas roadhouse","تكساسرودهاوس"] },
    { name: 'The Cheesecake Factory', domain: 'thecheesecakefactoryme.com', aliases: ["ذا تشيزكيك فاكتوري","The Cheesecake Factory","the cheesecake factory","ذاتشيزكيك فاكتوري"] },
    { name: 'Nandos', domain: 'nandos.sa', aliases: ["نانتوز","Nandos","nandos"] },
    { name: 'Paul Cafe', domain: 'paularabia.com', aliases: ["بول كافيه","Paul Cafe","paul cafe","بولكافيه"] },
    { name: 'Johnny Rockets', domain: 'johnnyrockets.com', aliases: ["جوني روكتس","Johnny Rockets","johnny rockets","جونيروكتس"] },
    { name: 'Shake Shack', domain: 'shakeshack.com', aliases: ["شيك شاك","Shake Shack","shake shack","شيكشاك"] },
    { name: 'Five Guys', domain: 'fiveguys.sa', aliases: ["فايف قايز","Five Guys","five guys","فايفقايز"] },
    { name: 'Subway', domain: 'subway.com', aliases: ["صب واي","Subway","subway","صبواي"] },
    { name: 'Texas Chicken', domain: 'texaschicken.sa', aliases: ["تكساس تشيكن","Texas Chicken","texas chicken","تكساستشيكن"] },
    { name: 'Al Tazaj', domain: 'altazaj.com.sa', aliases: ["التازج","Al Tazaj","al tazaj"] },
    { name: 'Fauchon', domain: 'fauchon.com', aliases: ["فوشون","Fauchon","fauchon"] },
    { name: 'Laduree', domain: 'laduree.sa', aliases: ["لادوريه","Laduree","laduree"] },
    { name: 'Address Cafe', domain: 'addresscafe.co', aliases: ["عنوان القهوة","Address Cafe","address cafe","عنوانالقهوة"] },
    { name: 'Elixir Bunn', domain: 'elixirbunn.com', aliases: ["إكسير البن","Elixir Bunn","elixir bunn","إكسيرالبن"] },
    { name: 'Java Time', domain: 'javatime.com', aliases: ["جافا تايم","Java Time","java time","جافاتايم"] },
    { name: 'Dr. Cafe', domain: 'dr-cafe.com', aliases: ["دكتور كيف","Dr. Cafe","dr. cafe","دكتوركيف"] },
    { name: 'Urth Caffe', domain: 'urthcaffe.sa', aliases: ["أرث كافيه","Urth Caffe","urth caffe","أرثكافيه"] },
    { name: 'Jolt Cafe', domain: 'joltcoffeeco.com', aliases: ["جولت كافيه","Jolt Cafe","jolt cafe","جولتكافيه"] },
    { name: 'Beuq Cafe', domain: 'beuqcafe.com', aliases: ["بيوق كافيه","Beuq Cafe","beuq cafe","بيوقكافيه"] },
    { name: 'Joe & The Juice', domain: 'joejuice.com', aliases: ["جو أند ذا ج juice","Joe & The Juice","joe & the juice","جوأند ذا ج juice"] },
    { name: 'Toastic', domain: 'toastic.com', aliases: ["توستك","Toastic","toastic"] },
    { name: 'Sultan Delight Burger', domain: 'sultandelightburger.com', aliases: ["سلطان ديلايت برجر","Sultan Delight Burger","sultan delight burger","سلطانديلايت برجر"] },
    { name: 'Jan Burger', domain: 'janburger.com', aliases: ["جان برجر","Jan Burger","jan burger","جانبرجر"] },
    { name: 'Diet Center', domain: 'dietcenter.com.sa', aliases: ["دايت سنتر","Diet Center","diet center","دايتسنتر"] },
    { name: 'Diet Watchers', domain: 'dietwatchers.com.sa', aliases: ["دايت واتشرز","Diet Watchers","diet watchers","دايتواتشرز"] },
    { name: 'Helens Bakery', domain: 'helensbakery.com', aliases: ["هيلين المخبز","Helens Bakery","helens bakery","هيلينالمخبز"] },
    { name: 'Munch Bakery', domain: 'munchbakery.com', aliases: ["منش بيكري","Munch Bakery","munch bakery","منشبيكري"] },
    { name: 'Anoosh', domain: 'anoosh.sa', aliases: ["أنوش","Anoosh","anoosh"] },
    { name: 'Muvi Cinemas', domain: 'muvicinemas.com', aliases: ["موفي سينما","Muvi Cinemas","muvi cinemas","موفيسينما"] },
    { name: 'Vox Cinemas', domain: 'ksa.voxcinemas.com', aliases: ["فوكس سينما","Vox Cinemas","vox cinemas","فوكسسينما"] },
    { name: 'AMC Cinemas', domain: 'amccinemas.com', aliases: ["إيه إم سي سينما","AMC Cinemas","amc cinemas","إيهإم سي سينما"] },
    { name: 'Talabat', domain: 'talabat.com', aliases: ["طلبَات","Talabat","talabat"] },
    { name: 'Nana', domain: 'nana.sa', aliases: ["نعناع","Nana","nana"] },
    { name: 'Ninja', domain: 'ananinja.com', aliases: ["نينجا","Ninja","ninja"] },
    { name: 'Sary', domain: 'sary.com', aliases: ["ساري","Sary","sary"] },
    { name: 'Zid', domain: 'zid.sa', aliases: ["زد","Zid","zid"] },
    { name: 'Salla', domain: 'salla.sa', aliases: ["سلة","Salla","salla"] },
    { name: 'Tamara', domain: 'tamara.co', aliases: ["تمارا","Tamara","tamara"] },
    { name: 'Tabby', domain: 'tabby.ai', aliases: ["تابي","Tabby","tabby"] },
    { name: 'Tympo', domain: 'tympo.io', aliases: ["تمبوس","Tympo","tympo"] },
    { name: 'Red Bull Mobile', domain: 'redbullmobile.sa', aliases: ["ريد بول موبايل","Red Bull Mobile","red bull mobile","ريدبول موبايل"] },
    { name: 'Salam Mobile', domain: 'salam.sa', aliases: ["سلام للاتصالات","Salam Mobile","salam mobile","سلامللاتصالات"] },
    { name: 'Bank AlJazira', domain: 'baj.com.sa', aliases: ["بنك الجزيرة","Bank AlJazira","bank aljazira","بنكالجزيرة"] },
    { name: 'The Saudi Investment Bank', domain: 'saib.com.sa', aliases: ["البنك السعودي للاستثمار","The Saudi Investment Bank","the saudi investment bank","البنكالسعودي للاستثمار"] },
    { name: 'Arab National Bank', domain: 'anb.com.sa', aliases: ["البنك العربي الوطني","Arab National Bank","arab national bank","البنكالعربي الوطني"] },
    { name: 'GIB', domain: 'gib.com', aliases: ["بنك الخليج الدولي","GIB","gib","بنكالخليج الدولي"] },
    { name: 'Tiqmo', domain: 'tiqmo.com', aliases: ["تيكو","Tiqmo","tiqmo"] },
    { name: 'Mobily Pay', domain: 'mobilypay.sa', aliases: ["موبايلي باي","Mobily Pay","mobily pay","موبايليباي"] },
    { name: 'Lendo', domain: 'lendo.sa', aliases: ["ليندو","Lendo","lendo"] },
    { name: 'Manafa', domain: 'manafa.sa', aliases: ["منافع","Manafa","manafa"] },
    { name: 'Camel Step', domain: 'camelstep.com', aliases: ["كوفى ستيبس","Camel Step","camel step","كوفىستيبس"] },
    { name: 'Soil Cafe', domain: 'soil-cafe.com', aliases: ["صويل كافيه","Soil Cafe","soil cafe","صويلكافيه"] },
    { name: 'Coyard', domain: 'coyard.co', aliases: ["كويارد كافيه","Coyard","coyard","كوياردكافيه"] },
    { name: 'Focus Cafe', domain: 'focuscafe.sa', aliases: ["فوكس كافيه","Focus Cafe","focus cafe","فوكسكافيه"] },
    { name: 'Lines Cafe', domain: 'linescafe.sa', aliases: ["لاينز كافيه","Lines Cafe","lines cafe","لاينزكافيه"] },
    { name: 'Title Cafe', domain: 'title-cafe.com', aliases: ["تايتل كافيه","Title Cafe","title cafe","تايتلكافيه"] },
    { name: 'Draft Cafe', domain: 'draftcafe.com', aliases: ["درفت كافيه","Draft Cafe","draft cafe","درفتكافيه"] },
    { name: 'Black Cardamom', domain: 'blackcardamom.co', aliases: ["بلاك كارداموم","Black Cardamom","black cardamom","بلاككارداموم"] },
    { name: 'Wabi Sabi', domain: 'wabisabi-sa.com', aliases: ["وابي سابي","Wabi Sabi","wabi sabi","وابيسابي"] },
    { name: 'Shgardi', domain: 'shgardi.app', aliases: ["شغردي","Shgardi","shgardi"] },
    { name: 'Lugmety', domain: 'lugmety.com', aliases: ["لقمتي","Lugmety","lugmety"] },
    { name: 'The Chefz', domain: 'thechefz.co', aliases: ["ذا شيفز","The Chefz","the chefz","ذاشيفز"] },
    { name: 'Cari', domain: 'getcari.com', aliases: ["كاري","Cari","cari"] },
    { name: 'Jeeny', domain: 'jeeny.me', aliases: ["جيني","Jeeny","jeeny"] },
    { name: 'Kaiian', domain: 'kaiian.com', aliases: ["كيان للاتصالات","Kaiian","kaiian","كيانللاتصالات"] },
    { name: 'Sephora SA', domain: 'sephora.sa', aliases: ["سيفورا السعودية","Sephora SA","sephora sa","سيفوراالسعودية"] },
    { name: 'Bath & Body Works', domain: 'bathandbodyworks.com.sa', aliases: ["باث & بودي وركس","Bath & Body Works","bath & body works","باث& بودي وركس"] },
    { name: 'Victoria\'s Secret', domain: 'victoriassecret.com.sa', aliases: ["فيكتوريا سيكريت","Victoria's Secret","victoria's secret","فيكتورياسيكريت"] },
    { name: 'Pull & Bear', domain: 'pullandbear.com', aliases: ["بول & بير","Pull & Bear","pull & bear","بول& بير"] },
    { name: 'Bershka', domain: 'bershka.com', aliases: ["بيرشكا","Bershka","bershka"] },
    { name: 'Massimo Dutti', domain: 'massimodutti.com', aliases: ["ماسيمو دوتي","Massimo Dutti","massimo dutti","ماسيمودوتي"] },
    { name: 'Stradivarius', domain: 'stradivarius.com', aliases: ["ستراديفاريوس","Stradivarius","stradivarius"] },
    { name: 'Mango', domain: 'shop.mango.com', aliases: ["مانجو","Mango","mango"] },
    { name: 'Babyshop', domain: 'babyshopstores.com', aliases: ["بيبي شوب","Babyshop","babyshop","بيبيشوب"] },
    { name: 'Shoe Mart', domain: 'shoemartstores.com', aliases: ["شو مارت","Shoe Mart","shoe mart","شومارت"] },
    { name: 'Home Centre', domain: 'homecentrestores.com', aliases: ["هوم سنتر","Home Centre","home centre","هومسنتر"] },
    { name: 'West Elm', domain: 'westelm.com.sa', aliases: ["ويست إلم","West Elm","west elm","ويستإلم"] },
    { name: 'Pottery Barn', domain: 'potterybarn.com.sa', aliases: ["بوتري بارن","Pottery Barn","pottery barn","بوتريبارن"] },
    { name: 'Whites', domain: 'whites.net', aliases: ["وايتس","Whites","whites"] },
    { name: 'Lemon Pharmacy', domain: 'lemon.sa', aliases: ["ليمون صيدلية","Lemon Pharmacy","lemon pharmacy","ليمونصيدلية"] },
    { name: 'Manuel Market', domain: 'manuelmarket.com', aliases: ["مانويل ماركت","Manuel Market","manuel market","مانويلماركت"] },
    { name: 'Farm Supermarkets', domain: 'farm.com.sa', aliases: ["أسواق المزرعة","Farm Supermarkets","farm supermarkets","أسواقالمزرعة"] },
    { name: 'Spar Saudi', domain: 'spar.sa', aliases: ["سبار","Spar Saudi","spar saudi"] },
    { name: 'Al Sadhan', domain: 'al-sadhan.com', aliases: ["أسواق السدحان","Al Sadhan","al sadhan","أسواقالسدحان"] },
    { name: '50 Fruits', domain: '50fruits.com', aliases: ["عصيرات 50 فاكهة","50 Fruits","50 fruits","عصيرات50 فاكهة"] },
    { name: 'Juice Time', domain: 'juicetime.sa', aliases: ["عصير تايم","Juice Time","juice time","عصيرتايم"] },
    { name: 'Mango Talaat', domain: 'mangotalaat.com', aliases: ["مانجو طلعت","Mango Talaat","mango talaat","مانجوطلعت"] },
    { name: 'Pastel', domain: 'pastel.sa', aliases: ["باستيل","Pastel","pastel"] },
    { name: 'Dip n Dip', domain: 'dipndip.com', aliases: ["ديب ان ديب","Dip n Dip","dip n dip","ديبان ديب"] },
    { name: 'L\'ETO', domain: 'letocofe.ae', aliases: ["ليتو كافيه","L'ETO","l'eto","ليتوكافيه"] },
    { name: 'Virgin Megastore', domain: 'virginmegastore.sa', aliases: ["فيرجن ميجاستور","Virgin Megastore","virgin megastore","فيرجنميجاستور"] },
    { name: 'X-cite', domain: 'xcite.com.sa', aliases: ["إكسايت للأجهزة","X-cite","x-cite","إكسايتللأجهزة"] },
    { name: 'ITC', domain: 'itc.sa', aliases: ["المتكاملة","ITC","itc"] },
    { name: 'Lebara Mobile', domain: 'lebara.sa', aliases: ["ليبارا موبايل","Lebara Mobile","lebara mobile","ليباراموبايل"] },
    { name: 'FRiENDi Mobile', domain: 'friendimobile.com', aliases: ["فرندي موبايل","FRiENDi Mobile","friendi mobile","فرنديموبايل"] },
    { name: 'Tas\'helat', domain: 'tashelat.com', aliases: ["تسهيلات","Tas'helat","tas'helat"] },
    { name: 'Applebee\'s', domain: 'applebees.com.sa', aliases: ["أبل بيز","Applebee's","applebee's","أبلبيز"] },
    { name: 'Chili\'s', domain: 'chilis.com.sa', aliases: ["تشيليز","Chili's","chili's"] },
    { name: 'Outback Steakhouse', domain: 'outback.sa', aliases: ["أوتباك ستيك هاوس","Outback Steakhouse","outback steakhouse","أوتباكستيك هاوس"] },
    { name: 'Fuddruckers', domain: 'fuddruckers.com.sa', aliases: ["فدركرز","Fuddruckers","fuddruckers"] },
    { name: 'P.F. Chang\'s', domain: 'pfchangs.com.sa', aliases: ["بي اف تشانغز","P.F. Chang's","p.f. chang's","بياف تشانغز"] },
    { name: 'Operation Falafel', domain: 'operationfalafel.com', aliases: ["أوبريشن فلافل","Operation Falafel","operation falafel","أوبريشنفلافل"] },
    { name: 'Baba Khabaz', domain: 'babakhabaz.com', aliases: ["بابا خباز","Baba Khabaz","baba khabaz","باباخباز"] },
    { name: 'Kutlet', domain: 'kutletburger.com', aliases: ["كتلت برجر","Kutlet","kutlet","كتلتبرجر"] },
    { name: 'Signor Sassi', domain: 'signorsassi.co.uk', aliases: ["سيغنور ساسي","Signor Sassi","signor sassi","سيغنورساسي"] },
    { name: 'Cipriani Riyadh', domain: 'cipriani.com', aliases: ["سيبريانى الرياض","Cipriani Riyadh","cipriani riyadh","سيبريانىالرياض"] },
    { name: 'Le Cafe', domain: 'lecafe.com', aliases: ["لي كافيه","Le Cafe","le cafe","ليكافيه"] },
    { name: 'Firehouse Subs', domain: 'firehousesubs.com.sa', aliases: ["فاير هاوس سابز","Firehouse Subs","firehouse subs","فايرهاوس سابز"] },
    { name: 'Raising Canes', domain: 'raisingcanes.com', aliases: ["ريزينج كينز","Raising Canes","raising canes","ريزينجكينز"] },
    { name: 'Bafarat Cafe', domain: 'bafaratcafe.com', aliases: ["بيفار كافيه","Bafarat Cafe","bafarat cafe","بيفاركافيه"] },
    { name: 'Tihama', domain: 'tihama.com.sa', aliases: ["مكتبة تهامة","Tihama","tihama","مكتبةتهامة"] },
    { name: 'Home Box', domain: 'homeboxstores.com', aliases: ["هوم بوكس","Home Box","home box","هومبوكس"] },
    { name: 'Redtag', domain: 'redtag-stores.com', aliases: ["رد تاغ","Redtag","redtag","ردتاغ"] },
    { name: 'Elite Man', domain: 'eliteman.sa', aliases: ["الرجل النخبة","Elite Man","elite man","الرجلالنخبة"] },
    { name: 'Toys R Us SA', domain: 'toysrus.com.sa', aliases: ["تويز آر أص السعودية","Toys R Us SA","toys r us sa","تويزآر أص السعودية"] },
    { name: 'Flow Progressive Logistics', domain: 'flowpl.com', aliases: ["فلو للشحن","Flow Progressive Logistics","flow progressive logistics","فلوللشحن"] },
    { name: 'SMSA Express', domain: 'smsaexpress.com', aliases: ["سمسا إكسبريس","SMSA Express","smsa express","سمساإكسبريس"] },
    { name: 'Aramex', domain: 'aramex.com', aliases: ["أرامكس","Aramex","aramex"] },
    { name: 'SPL', domain: 'splonline.com.sa', aliases: ["سبل (البريد السعودي)","SPL","spl","سبل(البريد السعودي)"] },
    { name: 'Riyadh Chains', domain: 'chains.sa', aliases: ["سلاسل الرياض","Riyadh Chains","riyadh chains","سلاسلالرياض"] },
    { name: 'Al Hokair Group', domain: 'al Hokair.com', aliases: ["الحكير للسياحة والتنمية","Al Hokair Group","al hokair group","الحكيرللسياحة والتنمية"] },
    { name: 'Alshaya Group', domain: 'alshaya.com', aliases: ["شركة الشايع","Alshaya Group","alshaya group","شركةالشايع"] },
    { name: 'Al-Futtaim', domain: 'alfuttaim.com', aliases: ["مجموعة الفطيم","Al-Futtaim","al-futtaim","مجموعةالفطيم"] },
    { name: 'The Body Shop SA', domain: 'thebodyshop.com.sa', aliases: ["بودي شوب السعودية","The Body Shop SA","the body shop sa","بوديشوب السعودية"] },
    { name: 'Abdul Samad Al Qurashi', domain: 'asqgrp.com', aliases: ["عبدالصمد القرشي","Abdul Samad Al Qurashi","abdul samad al qurashi","عبدالصمدالقرشي"] },
    { name: 'Arabian Oud', domain: 'arabianoud.com', aliases: ["العربية للعود","Arabian Oud","arabian oud","العربيةللعود"] },
    { name: 'Oud Elite', domain: 'oudelite.com', aliases: ["نخبة العود","Oud Elite","oud elite","نخبةالعود"] },
    { name: 'Ibrahim Al.Qurashi', domain: 'ibrahimalqurashi.com', aliases: ["إبراهيم القرشي","Ibrahim Al.Qurashi","ibrahim al.qurashi","إبراهيمالقرشي"] },
    { name: 'Almajed 4 Oud', domain: 'almajed4oud.com', aliases: ["الماجد للعود","Almajed 4 Oud","almajed 4 oud","الماجدللعود"] },
    { name: 'Deraah', domain: 'deraahstore.com', aliases: ["درعه للعطور","Deraah","deraah","درعهللعطور"] },
    { name: 'Danube Bakery & Cafe', domain: 'danubeco.com', aliases: ["الدانوب كافيه","Danube Bakery & Cafe","danube bakery & cafe","الدانوبكافيه"] },
    { name: 'Bavaria Coffee', domain: 'bavariacoffee.com', aliases: ["بافاريا كافيه","Bavaria Coffee","bavaria coffee","بافارياكافيه"] },
    { name: 'Flat White', domain: 'flatwhite.sa', aliases: ["فلات وايت كافيه","Flat White","flat white","فلاتوايت كافيه"] },
    { name: 'Earth Cart', domain: 'earthcart.com', aliases: ["إيرث كرت","Earth Cart","earth cart","إيرثكرت"] },
    { name: 'Shawaya House', domain: 'shawayahouse.com.sa', aliases: ["شواية الخليج","Shawaya House","shawaya house","شوايةالخليج"] },
    { name: 'Woodstock Bakery', domain: 'woodstock.sa', aliases: ["مخابز الحطب","Woodstock Bakery","woodstock bakery","مخابزالحطب"] },
    { name: 'Shawarma Hlayel', domain: 'shawarmahlayel.com', aliases: ["شاورما هليل","Shawarma Hlayel","shawarma hlayel","شاورماهليل"] },
    { name: 'House of Donuts', domain: 'houseofdonuts.com', aliases: ["هاوس أوف دونتس","House of Donuts","house of donuts","هاوسأوف دونتس"] },
    { name: 'Ladies Tart', domain: 'ladiestart.sa', aliases: ["لاديس تارت","Ladies Tart","ladies tart","لاديستارت"] },
    { name: 'Sobia Al-Madina', domain: 'sobia.sa', aliases: ["سوبيا المدينة","Sobia Al-Madina","sobia al-madina","سوبياالمدينة"] },
    { name: 'Al-Jazeera Perfumes', domain: 'aljazeeraperfumes.com', aliases: ["الجزيرة للعطور","Al-Jazeera Perfumes","al-jazeera perfumes","الجزيرةللعطور"] },
    { name: 'Deer Cafe', domain: 'deercafe.sa', aliases: ["دير كافيه","Deer Cafe","deer cafe","ديركافيه"] },
    { name: 'Tutti Cafe', domain: 'tutticafe.com.sa', aliases: ["توتي كافيه","Tutti Cafe","tutti cafe","توتيكافيه"] },
    { name: 'Black Stone', domain: 'blackstonecafe.sa', aliases: ["بلاك ستون كافيه","Black Stone","black stone","بلاكستون كافيه"] },
    { name: 'Red Square', domain: 'redsquare.com.sa', aliases: ["الميدان الأحمر","Red Square","red square","الميدانالأحمر"] },
    { name: 'Loft Cafe', domain: 'loftcafe.sa', aliases: ["لوفت كافيه","Loft Cafe","loft cafe","لوفتكافيه"] },
    { name: 'Terra Cafe', domain: 'terracafe.sa', aliases: ["ترا كافيه","Terra Cafe","terra cafe","تراكافيه"] },
    { name: 'Cherry Taste', domain: 'cherrytaste.sa', aliases: ["مذاق الكرز","Cherry Taste","cherry taste","مذاقالكرز"] },
    { name: 'Atyab Al Marshoud', domain: 'atyabalmarshoud.com', aliases: ["أطياب المرشود","Atyab Al Marshoud","atyab al marshoud","أطيابالمرشود"] },
    { name: 'Sikkath Al-Teeb', domain: 'sikkathalteeb.com', aliases: ["سكة الطيب","Sikkath Al-Teeb","sikkath al-teeb","سكةالطيب"] },
    { name: 'Cardial', domain: 'cardial.sa', aliases: ["كارديال","Cardial","cardial"] },
    { name: 'Aldaham Watches', domain: 'aldaham.com', aliases: ["الدهام للساعات","Aldaham Watches","aldaham watches","الدهامللساعات"] },
    { name: 'Alshaya Watches', domain: 'alshayawatches.com', aliases: ["الشايع للساعات","Alshaya Watches","alshaya watches","الشايعللساعات"] },
    { name: 'National Store', domain: 'nationalstore.sa', aliases: ["المتجر الوطني","National Store","national store","المتجرالوطني"] },
    { name: 'Al-Shallal Group', domain: 'alshallal.com.sa', aliases: ["مجموعة الشلال","Al-Shallal Group","al-shallal group","مجموعةالشلال"] },
    { name: 'Snow City', domain: 'snowcitysa.com', aliases: ["سنو سيتي","Snow City","snow city","سنوسيتي"] },
    { name: 'Fakieh Aquarium', domain: 'fakiehaquarium.com', aliases: ["فقيه اكواريوم","Fakieh Aquarium","fakieh aquarium","فقيهاكواريوم"] },
    { name: 'Al-Shallal Theme Park', domain: 'alshallal.com.sa', aliases: ["الشلال تيم بارك","Al-Shallal Theme Park","al-shallal theme park","الشلالتيم بارك"] },
    { name: 'Boulevard Riyadh City', domain: 'riyadhseason.sa', aliases: ["بوليفارد رياض سيتي","Boulevard Riyadh City","boulevard riyadh city","بوليفاردرياض سيتي"] },
    { name: 'Winter Wonderland Riyadh', domain: 'winterwonderlandriyadh.com', aliases: ["وندر لاند الرياض","Winter Wonderland Riyadh","winter wonderland riyadh","وندرلاند الرياض"] },
];

// ─── Smart Fuzzy Matching System ───
const normalize = (s: string): string => {
    return s
        .toLowerCase()
        .trim()
        .replace(/[\s\-\_\.]+/g, '') // remove spaces, dashes, underscores, dots
        .replace(/[أإآا]/g, 'ا')     // normalize Arabic alef variants
        .replace(/[ؤ]/g, 'و')        // normalize waw
        .replace(/[ئ]/g, 'ي')        // normalize ya
        .replace(/[ة]/g, 'ه')        // normalize ta marbuta
        .replace(/[ى]/g, 'ي')        // normalize alef maqsura
        .replace(/[\u064B-\u065F\u0670]/g, ''); // remove tashkeel/diacritics
};

const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
};

const fuzzyMatch = (guess: string, brand: Brand): boolean => {
    const g = normalize(guess);
    if (g.length < 2) return false; // too short to be meaningful

    // Collect all possible targets
    const targets = [
        brand.name,
        brand.domain.split('.')[0],
        ...brand.aliases
    ];

    for (const target of targets) {
        const t = normalize(target);
        if (!t) continue;

        // 1. Exact match after normalization
        if (g === t) return true;

        // 2. One contains the other (abbreviation / partial)
        //    e.g. "ماك" matches "ماكدونالدز", "البيك" matches "البيك"
        if (t.length >= 3 && g.length >= 3) {
            if (t.includes(g) && g.length >= Math.min(3, Math.floor(t.length * 0.4))) return true;
            if (g.includes(t) && t.length >= Math.min(3, Math.floor(g.length * 0.4))) return true;
        }

        // 3. Starts with (first few characters match)
        //    e.g. "ستار" matches "ستاربكس"
        if (g.length >= 3 && t.startsWith(g)) return true;
        if (t.length >= 3 && g.startsWith(t)) return true;

        // 4. Levenshtein distance (typo tolerance)
        //    Allow 1 typo for short words, 2 for medium, 3 for long
        const maxLen = Math.max(g.length, t.length);
        const allowedErrors = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : 3;
        const dist = levenshtein(g, t);
        if (dist <= allowedErrors && dist < t.length * 0.5) return true;
    }

    return false;
};

export const LogoRound: React.FC<LogoRoundProps> = ({ onHome, isOBS }) => {
    const [config, setConfig] = useState<GameConfig>({
        joinKeyword: 'شعار',
        maxPlayers: 100,
        roundDuration: 20,
        autoProgress: true,
        totalRounds: 10,
        showHints: true,
        difficulty: 'Easy',
        soundEffects: true,
        streamerMode: false
    });

    const [phase, setPhase] = useState<GamePhase>('SETUP');
    const [participants, setParticipants] = useState<ChatUser[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [timer, setTimer] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [roundWinner, setRoundWinner] = useState<ChatUser | null>(null);
    const [usedBrands, setUsedBrands] = useState<Set<string>>(new Set());

    const phaseRef = useRef(phase);
    const configRef = useRef(config);
    const currentBrandRef = useRef(currentBrand);
    const participantsRef = useRef(participants);

    useEffect(() => {
        phaseRef.current = phase;
        configRef.current = config;
        currentBrandRef.current = currentBrand;
        participantsRef.current = participants;
    }, [phase, config, currentBrand, participants]);

    const nextLogo = () => {
        const availableBrands = POPULAR_BRANDS.filter(b => !usedBrands.has(b.domain));
        let pool = availableBrands.length > 0 ? availableBrands : POPULAR_BRANDS;
        if (availableBrands.length === 0) {
            setUsedBrands(new Set());
        }
        const random = pool[Math.floor(Math.random() * pool.length)];
        setUsedBrands(prev => new Set(prev).add(random.domain));
        setCurrentBrand(random);
        setRoundWinner(null);
        setTimer(config.roundDuration);
        setPhase('PLAYING');
    };

    const skipLogo = () => {
        if (phase !== 'PLAYING') return;
        const availableBrands = POPULAR_BRANDS.filter(b => !usedBrands.has(b.domain));
        let pool = availableBrands.length > 0 ? availableBrands : POPULAR_BRANDS;
        if (availableBrands.length === 0) {
            setUsedBrands(new Set());
        }
        const random = pool[Math.floor(Math.random() * pool.length)];
        setUsedBrands(prev => new Set(prev).add(random.domain));
        setCurrentBrand(random);
        setRoundWinner(null);
        setTimer(config.roundDuration);
    };

    useEffect(() => {
        const unsubscribe = chatService.onMessage((msg) => {
            const content = msg.content.trim().toLowerCase();
            const username = msg.user.username;

            if (phaseRef.current === 'LOBBY') {
                if (content === configRef.current.joinKeyword.toLowerCase()) {
                    setParticipants(prev => {
                        if (prev.length >= configRef.current.maxPlayers) return prev;
                        if (prev.some(p => p.username === username)) return prev;

                        // Fetch real Kick avatar asynchronously
                        chatService.fetchKickAvatar(username).then(avatar => {
                            if (avatar) {
                                setParticipants(current => current.map(p =>
                                    p.username === username ? { ...p, avatar } : p
                                ));
                            }
                        });

                        return [...prev, msg.user];
                    });
                }
            }

            if (phaseRef.current === 'PLAYING' && currentBrandRef.current) {
                if (!participantsRef.current.some(p => p.username === username)) return;

                const brand = currentBrandRef.current;
                const isCorrect = fuzzyMatch(content, brand);

                if (isCorrect) {
                    handleWin(msg.user);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleWin = (user: ChatUser) => {
        setRoundWinner(user);
        setScores(prev => ({ ...prev, [user.username]: (prev[user.username] || 0) + 1 }));
        setPhase('REVEAL');

        setTimeout(() => {
            if (currentRound >= config.totalRounds) {
                setPhase('FINALE');
                leaderboardService.recordWin(user.username, user.avatar || '', 200);
            } else {
                setCurrentRound(r => r + 1);
                nextLogo();
            }
        }, 4000);
    };

    useEffect(() => {
        let interval: number;
        if (phase === 'PLAYING' && timer > 0) {
            interval = window.setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (phase === 'PLAYING' && timer === 0) {
            setPhase('REVEAL');
            setTimeout(() => {
                if (currentRound >= config.totalRounds) {
                    setPhase('FINALE');
                } else {
                    setCurrentRound(r => r + 1);
                    nextLogo();
                }
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [phase, timer]);

    const startLobby = () => setPhase('LOBBY');

    const startRound = () => {
        setCurrentRound(1);
        setScores({});
        nextLogo();
    };

    const resetGame = () => {
        setPhase('SETUP');
        setParticipants([]);
        setScores({});
        setCurrentRound(1);
    };

    return (
        <div className="w-full h-full flex flex-col items-center bg-transparent text-right font-display select-none overflow-hidden" dir="rtl">
            {/* Dark Professional Background */}
            <div className="absolute inset-0 bg-[#08080a] -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.1),transparent_70%)]"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full"></div>
                {/* Brand pattern overlay */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            {phase === 'SETUP' && (
                <div className="w-full max-w-3xl mt-8 animate-in fade-in zoom-in duration-700">
                    <div className="text-center mb-8">
                            <Globe size={48} className="mx-auto text-blue-500 mb-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                            <h1 className="text-5xl font-black text-white italic tracking-tighter">جـولـة الـشـعـارات</h1>
                        <p className="text-blue-500 font-black tracking-[0.4em] text-[10px] uppercase mt-2">Premium Brand Challenge</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl space-y-5">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Settings className="text-blue-400" /> إعـدادات الـجـولـة
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">كلمة الانضمام</label>
                                    <input
                                        value={config.joinKeyword}
                                        onChange={e => setConfig({ ...config, joinKeyword: e.target.value })}
                                        className="w-full bg-black/40 border-2 border-white/10 focus:border-blue-400 rounded-2xl p-3 text-white font-bold outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-400 uppercase">عـدد الـجـولات</label>
                                        <span className="text-xl font-black text-blue-400 font-mono">{config.totalRounds}</span>
                                    </div>
                                    <input
                                        type="range" min="5" max="500" step="5"
                                        value={config.totalRounds}
                                        onChange={e => setConfig({ ...config, totalRounds: +e.target.value })}
                                        className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                    />
                                </div>

                                {/* New Aesthetic Settings (Visual Only/Basic Logic) */}
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} className="text-blue-400" />
                                        <span className="text-[10px] font-bold text-gray-300">تلميحات ذكية</span>
                                    </div>
                                    <div onClick={() => setConfig({ ...config, showHints: !config.showHints })} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${config.showHints ? 'bg-blue-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.showHints ? 'right-0.5' : 'right-4.5'}`}></div>
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-purple-400" />
                                        <span className="text-[10px] font-bold text-gray-300">الصعوبة</span>
                                    </div>
                                    <span onClick={() => setConfig({ ...config, difficulty: config.difficulty === 'Easy' ? 'Hard' : 'Easy' })} className="text-[10px] font-black bg-black/40 px-2 py-1 rounded-lg cursor-pointer hover:text-white transition-colors text-gray-400 uppercase">{config.difficulty}</span>
                                </div>

                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Volume2 size={16} className="text-green-400" />
                                        <span className="text-[10px] font-bold text-gray-300">مؤثرات صوتية</span>
                                    </div>
                                    <div onClick={() => setConfig({ ...config, soundEffects: !config.soundEffects })} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${config.soundEffects ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.soundEffects ? 'right-0.5' : 'right-4.5'}`}></div>
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Monitor size={16} className="text-orange-400" />
                                        <span className="text-[10px] font-bold text-gray-300">وضع البث</span>
                                    </div>
                                    <div onClick={() => setConfig({ ...config, streamerMode: !config.streamerMode })} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${config.streamerMode ? 'bg-orange-500' : 'bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.streamerMode ? 'right-0.5' : 'right-4.5'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="glass-card p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl flex-1 flex flex-col justify-center items-center text-center">
                                <Target size={32} className="text-indigo-400 mb-3 animate-float" />
                                <h4 className="text-base font-black text-white mb-2">قـواعـد الـمـنـافـسة</h4>
                                <p className="text-gray-400 text-sm font-bold leading-relaxed px-6">
                                    ستظهر شعارات لماركات عالمية، حاول تخمين اسم الماركة في الشات بأسرع وقت ممكن. أول من يجيب بشكل صحيح يحصل على نقطة!
                                </p>
                            </div>

                            <button
                                onClick={startLobby}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-5 rounded-[2rem] text-2xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 group"
                            >
                                بـدأ الـبـحـث <Search className="group-hover:scale-125 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <button onClick={onHome} className="mt-6 mx-auto flex items-center gap-2 text-gray-500 hover:text-white font-bold transition-all">
                        <ChevronLeft /> العودة للرئيسية
                    </button>
                </div>
            )}

            {phase === 'LOBBY' && (
                <div className="w-full max-w-4xl mt-8 animate-in fade-in duration-700 flex flex-col items-center">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-black text-white italic tracking-tighter mb-3 red-neon-text">تـقـصـي الـحـقـائق</h1>
                        <div className="flex items-center justify-center gap-3 bg-white/5 px-6 py-3 rounded-[1.5rem] border border-white/10 backdrop-blur-md shadow-2xl">
                            <span className="text-lg font-bold text-gray-300">أرسل الكلمة للانـضمـام للتحـدي:</span>
                            <span className="text-3xl font-black text-blue-400 px-5 py-1 bg-blue-400/10 rounded-2xl border border-blue-400/30">{config.joinKeyword}</span>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-6 mb-12 overflow-y-auto max-h-[350px] custom-scrollbar">
                        {participants.map((p, i) => (
                            <div key={p.username} className="glass-card p-3 rounded-[1.5rem] border border-white/5 flex flex-col items-center gap-3 animate-in zoom-in group hover:border-blue-500/30 transition-all bg-white/5" style={{ animationDelay: `${i * 30}ms` }}>
                                <div className="w-16 h-16 rounded-[1.25rem] border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform bg-zinc-900 flex items-center justify-center overflow-visible">
                                    <ProAvatar username={p.username} url={p.avatar} size="w-16 h-16" className="overflow-visible" />
                                </div>
                                <span className="font-black text-white text-sm truncate w-full text-center">{p.username}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-6">
                        <button onClick={resetGame} className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] text-gray-400 font-black border border-white/10 transition-all flex items-center gap-2">
                            <Trash2 size={18} /> إلـغـاء
                        </button>
                        <button
                            onClick={startRound}
                            disabled={participants.length < 1}
                            className="px-16 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:grayscale rounded-[1.5rem] text-white font-black text-xl shadow-[0_20px_40px_rgba(37,99,235,0.3)] transition-all flex items-center gap-3"
                        >
                            <Play size={22} /> بـدء الـجـولة الأولى ({participants.length})
                        </button>
                    </div>
                </div>
            )}

            {(phase === 'PLAYING' || phase === 'REVEAL') && currentBrand && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                    {/* Header Info */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                        <div className="flex flex-col gap-3">
                            <div className="glass-card px-6 py-3 rounded-[1.5rem] border border-white/10 flex items-center gap-4 bg-black/60 backdrop-blur-xl">
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">الـجـولـة</div>
                                    <div className="text-3xl font-black text-white font-mono">{currentRound} / {config.totalRounds}</div>
                                </div>
                                <Target size={28} className="text-blue-500" />
                            </div>
                            <div className="glass-card px-6 py-3 rounded-[1.5rem] border border-white/10 flex items-center gap-4 bg-black/60 backdrop-blur-xl">
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">الـوقـت</div>
                                    <div className={`text-2xl font-black font-mono ${timer < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</div>
                                </div>
                                <Clock size={24} className={timer < 5 ? 'text-red-500' : 'text-gray-500'} />
                            </div>
                        </div>

                        <div className="glass-card w-64 rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="font-black text-white italic">أفـضل الـمحـققين</h3>
                                <ShieldCheck size={16} className="text-blue-500" />
                            </div>
                            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([user, score], i) => (
                                    <div key={user} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-white font-black text-base border border-blue-500/30">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-black text-white">{user}</div>
                                            <div className="text-xs text-blue-400 font-bold">{score} شعارات صـحيحة</div>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(scores).length === 0 && (
                                    <div className="py-10 text-center opacity-20 italic font-bold">لا يـوجد نقـاط بـعـد</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logo Display Area */}
                    <div className="text-center animate-in zoom-in duration-500 flex flex-col items-center gap-8">
                        <div className="relative group">
                            {/* Decorative Rings */}
                            <div className="absolute -inset-12 border-2 border-dashed border-white/5 rounded-full animate-rotate-slow"></div>
                            <div className="absolute -inset-6 border-4 border-blue-500/5 rounded-full animate-rotate-reverse"></div>

                            <div className={`w-[300px] h-[300px] bg-white rounded-[2.5rem] flex items-center justify-center p-10 shadow-[0_0_100px_rgba(255,255,255,0.1),0_40px_100px_rgba(0,0,0,0.5)] border-4 border-zinc-900 transition-all duration-500 ${phase === 'REVEAL' ? 'scale-110 shadow-blue-500/20' : ''}`}>
                                <img
                                    src={`https://img.logo.dev/${currentBrand.domain}?token=${process.env.LOGO_DEV_TOKEN || ''}`}
                                    className="w-full h-full object-contain filter-none"
                                    alt="Brand Logo"
                                />

                                {phase === 'PLAYING' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <Search size={100} className="text-black/5" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {phase === 'PLAYING' ? (
                            <div className="space-y-4 flex flex-col items-center">
                                <h2 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-2xl">خـمّـن اسـم الـشـعـار!</h2>
                                <p className="text-base text-gray-500 font-bold uppercase tracking-widest animate-pulse">أرسل الإجابة في الشات حـالا!</p>
                                {!isOBS && (
                                    <button
                                        onClick={skipLogo}
                                        className="mt-2 px-8 py-3 bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 rounded-2xl text-gray-400 hover:text-orange-400 font-black text-sm transition-all flex items-center gap-2 group"
                                    >
                                        <SkipForward size={18} className="group-hover:translate-x-1 transition-transform" /> تخطي الشعار
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-bottom duration-500 space-y-4">
                                {roundWinner ? (
                                    <div className="flex flex-col items-center gap-4 bg-green-500/10 p-5 rounded-[2rem] border-4 border-green-500/30 backdrop-blur-xl">
                                        <div className="text-green-500 font-black text-lg uppercase tracking-[0.5em] mb-1">إجـابـة مـذهـلـة</div>
                                        <div className="flex items-center gap-5">
                                            <div className="w-20 h-20 rounded-[1.5rem] border-4 border-green-500 shadow-xl bg-zinc-900 flex items-center justify-center overflow-visible">
                                                <ProAvatar username={roundWinner.username} url={roundWinner.avatar} size="w-20 h-20" className="overflow-visible" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-4xl font-black text-white italic tracking-tighter mb-1">{roundWinner.username}</div>
                                                <div className="text-xl font-bold text-gray-400">الإجـابـة: <span className="text-white text-3xl mr-4">{currentBrand.name}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 bg-red-500/10 p-6 rounded-[2.5rem] border-4 border-red-500/30 backdrop-blur-xl">
                                        <h2 className="text-4xl font-black text-white opacity-50 italic">انـتهـى الـوقت!</h2>
                                        <p className="text-xl font-bold text-gray-400">الإجـابة كانت: <span className="text-white text-4xl mr-4">{currentBrand.name}</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {phase === 'FINALE' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full"></div>
                        <ShieldCheck size={100} className="text-blue-500 animate-pulse relative z-10" />
                    </div>

                    <h1 className="text-6xl font-black text-white italic tracking-tighter mb-4 drop-shadow-[0_20px_60px_rgba(59,130,246,0.3)]">أقـوى محـقق</h1>

                    {Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0] && (
                        <div className="flex flex-col items-center gap-5 mb-12 animate-in zoom-in duration-700 delay-300">
                            <div className="w-44 h-44 rounded-[2.5rem] border-4 border-blue-500 shadow-[0_0_120px_rgba(59,130,246,0.4)] relative bg-black/40 backdrop-blur-xl flex items-center justify-center overflow-visible">
                                <ProAvatar 
                                    username={Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]} 
                                    url={participants.find(p => p.username === Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0])?.avatar}
                                    size="w-44 h-44" 
                                    className="overflow-visible" 
                                />
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-black text-white mb-4 italic tracking-tighter">{Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]}</div>
                                <div className="text-2xl px-12 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-[1.5rem] shadow-2xl uppercase tracking-[0.2em] italic">
                                    SCORE: {Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0][1]} LOGOS
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-6">
                        <button onClick={onHome} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-[1.5rem] border border-white/10 transition-all text-lg">
                            الـرئـيـسـيـة
                        </button>
                        <button onClick={resetGame} className="px-16 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[1.5rem] transition-all text-xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-105">
                            تـحـدي جـديد
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
