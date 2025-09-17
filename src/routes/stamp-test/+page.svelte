<script>
    import { onMount } from 'svelte';

    // ── Plug your real lists when ready ──────────────────────────────────────────
    // import adjRaw from '$lib/words/adjectives.txt?raw'; // 500 lines
    // import nounRaw from '$lib/words/nouns.txt?raw';     // 1000 lines
    // const parseList = (raw) => raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    // const ADJ  = parseList(adjRaw);
    // const NOUN = parseList(nounRaw);

    // Temporary mini lists so the page runs immediately (replace with imports above)
    const ADJ  = ['adventurous','affable','agile','agreeable','amazing','amiable','amicable','amusing','angelic','appreciative','ardent','artful','artistic','astute','attentive','attractive','audacious','authentic','awesome','badass','ballsy','beauteous','beautiful','benevolent','benign','blessed','blithe','bold','brandnew','brave','brazen','brilliant','brisk','broadminded','bullish','buoyant','calm','candid','capable','carefree','careful','caring','casual','celestial','centered','charitable','cheery','chivalrous','classy','clean','clever','coherent','collected','colorful','comfy','commanding','committed','companionable','compassionate','competent','composed','confident','considerate','convivial','cool','cordial','courageous','courteous','cozy','creative','credible','crisp','cultured','dandy','dapper','daring','dauntless','dazzling','dear','debonair','decent','decisive','decorous','dedicated','deliberate','delicate','delightful','dependable','desirable','determined','devoted','dexterous','dignified','diligent','diplomatic','disciplined','discreet','distinctive','distinguished','dominant','doughty','downright','downtoearth','driven','durable','earnest','easygoing','ebullient','ecstatic','effervescent','efficient','effulgent','effusive','elated','elegant','elevated','eloquent','empathetic','enchanting','encouraging','endearing','energetic','engaging','enigmatic','enjoyable','enlightened','enlivening','enthusiastic','epic','equable','essential','estimable','eternal','ethical','euphoric','exalting','excellent','exciting','exemplary','exuberant','fabulous','fairminded','faithful','fancy','fashionable','favorable','fearless','feisty','felicitous','festive','fetching','fierce','fine','firm','firstclass','flamboyant','flawless','flexible','flowing','fluent','fluid','focused','fond','forceful','formidable','forthright','fortified','fortunate','friendly','funloving','funny','gallant','generous','genial','gentle','genuine','gifted','glad','gleaming','gleeful','glimmering','glorious','glowing','good','goodnatured','graceful','gracious','grand','grateful','gregarious','gritty','grounded','handsome','happy','hardcore','hardy','harmonious','heartening','heartfelt','heartwarming','hearty','heavenly','helpful','heroic','hip','honest','honorable','hopeful','hospitable','humane','humble','humorous','iconic','ideal','idealistic','imaginative','immaculate','impartial','impeccable','imposing','impressive','inclusive','incredible','independent','indomitable','ingenious','insightful','inspiring','integral','intelligent','intrepid','intriguing','intuitive','inventive','ironclad','ironwilled','jaunty','jazzy','jocular','jocund','jolly','jovial','joyful','joyous','jubilant','judicious','keen','kind','knightly','knowing','laudable','laureled','lavish','legendary','lenient','liberal','lighthearted','likable','limpid','lionhearted','lively','logical','lovable','lovely','loving','loyal','lucid','lucky','luminous','lyrical','magnanimous','magnetic','majestic','masterful','mellow','merciful','merry','methodical','meticulous','mighty','mirthful','modest','neat','neighborly','new','nifty','nimble','noble','notable','noteworthy','objective','openhearted','openminded','optimistic','orderly','original','outdoorsy','outgoing','outstanding','overjoyed','paramount','passionate','patient','peaceful','peppy','perceptive','perky','personable','perspicacious','persuasive','phenomenal','philanthropic','philosophical','picturesque','playful','pleasant','pleasing','plucky','poetic','poised','polished','polite','popular','positive','potent','powerful','practical','pragmatic','precious','precise','preeminent','preferred','premium','prestigious','pretty','prime','principled','pristine','proactive','productive','proficient','profound','proper','proud','prudent','pugnacious','purebred','quaint','qualified','quickwitted','radiant','rational','reasonable','receptive','refined','refreshing','regal','rejoicing','relentless','reliable','remarkable','resolute','resourceful','respected','revered','romantic','rosy','rugged','sage','sanguine','satisfying','saucy','savvy','scenic','scholarly','scrappy','seasoned','secure','seemly','select','selfless','selfpossessed','sensible','serene','sharp','shrewd','sincere','sleek','slick','smart','smashing','smiling','smoldering','smooth','snappy','snazzy','sociable','solicitous','solid','sophisticated','soulful','sparkling','special','spectacular','speedy','spirited','spiritual','splendid','spontaneous','spunky','stable','stalwart','stately','steadfast','steady','steely','stellar','stern','stout','stouthearted','striking','strong','studious','stunning','sturdy','stylish','suave','sublime','successful','suitable','sunny','superb','supersharp','supersmart','superstrong','supersweet','superunique','supervaluable','supportive','supreme','surefooted','swaggering','sweet','swift','sympathetic','symphonic','tactful','tasteful','temperate','tenacious','terrific','thankful','thoughtful','tidy','tireless','tough','tranquil','transcendent','trustworthy','trusty','truthful','tuned','ultimate','unassuming','undaunted','unflappable','unflinching','unique','unpretentious','unruffled','unshakable','unyielding','upbeat','uplifting','upstanding','urbane','useful','valiant','valid','valuable','venerated','venturesome','veracious','versatile','vibrant','victorious','vigilant','vigorous','virtuous','visionary','vital','vivacious','vivid','warm','warmhearted','welcoming','whimsical','wholehearted','wholesome','wild','willful','willing','winsome','wise','witty','wonderful','wondrous','worthy','zany','zealous','zippy'];
    const NOUN = ['acorn','adaptor','agent','airbag','aircraft','airship','alarmbell','alarmclock','alligator','almond','alpaca','ambulance','anaconda','anchor','anchorwoman','anchovy','ant','antelope','anvil','apple','apricot','apron','aquariumfish','architect','armadillo','armchair','arrow','arrowhead','artefact','aunt','avocado','axolotl','baboon','baby','badger','bag','bakery','ball','balloon','banana','bandicoot','banker','barleycorn','barnacle','basenji','basilisk','basket','bassist','bat','beachball','beagle','bean','bear','bearcat','beaver','bed','bee','beetle','bell','bench','bezel','bicycle','bill','bird','biscuit','bison','blackbird','blanket','blazer','blender','blenny','blouse','blowtorch','bluebird','board','boat','bobcat','bone','book','bookcase','bookworm','boot','bottle','bow','boxer','boy','bracelet','branch','brat','bread','bream','brick','bridge','brother','buck','bucket','buffalo','bug','bulb','bull','bulldog','bullhead','bunkmate','bus','busdriver','butterfly','button','buzzard','buzzer','bystander','cabinet','cage','camel','camera','candy','cane','canoe','car','caracal','cardigan','carp','carpet','cart','cashier','cassowary','cat','catalog','catalyst','catfish','cave','caveman','cello','chair','chalk','chameleon','character','cheeseball','cheeseburger','cheesemaker','cheetah','chest','chick','chicken','chimpanzee','chipmunk','chronologist','ciabatta','cicada','clam','clock','cloud','coach','cobra','cockatoo','cocktail','coconut','cocoon','cod','coffeebean','coin','collie','comb','composer','computer','condor','conductor','controller','cookbook','cookie','cookiejar','cooler','copperhead','coral','corgi','costume','cottonmouth','cougar','cow','coyote','crab','crane','crestfish','crewman','cricket','crocodile','crow','cuckoo','cup','curveball','cushion','cuttlefish','dabbler','dachshund','dagger','daisy','damselfly','dandelion','dartboard','daughter','deer','dentist','designer','desk','desktop','detective','dewdrop','diamond','dingo','discus','dish','dockworker','doctor','dog','dogfish','dollar','dolphin','domino','donkey','donut','door','doorbell','dragon','dragonfly','drawer','dress','dresser','drone','drum','duck','duckling','dugong','eagle','ear','earphone','earring','earthling','earthworm','earwig','echidna','ecologist','eel','egg','eggplant','egret','elbow','electrician','elephant','elevator','elk','emu','engine','enthusiast','envelope','eraser','escalator','exhibitionist','eye','eyelash','facepainter','falcon','fan','farmer','feather','fellow','fence','fender','ferret','filmgoer','filmmaker','filmstar','filterfeeder','finch','finger','firefighter','firefly','fish','flag','flamingo','flashlight','flea','florist','flower','fly','flyer','foot','forester','fork','fox','frame','freezer','frog','fruit','funnel','futurist','gadfly','gadget','galvanizer','gamekeeper','gamer','gander','gangbuster','gaper','gardener','garlic','gatecrasher','gatekeeper','gazelle','gearbox','gecko','geographer','gerbil','gift','gingerbread','giraffe','girl','glass','glove','gnat','goat','gobbler','gobstopper','goldfish','goose','gopher','gorilla','gosling','governor','graduate','grain','grandfather','grandmother','grape','grapefruit','grasshopper','greenback','greyhound','groundhog','grouper','guardrail','guest','guitar','gull','gumball','haddock','hairdresser','hamburger','hammer','hamster','hand','handle','hanger','harbormaster','harrier','hat','hawk','haystack','head','heart','hedge','helmet','hen','herb','heron','herring','highflier','highlander','highlighter','hillclimber','hillwalker','hog','honeybadger','honeybee','honeybunch','hook','hoopster','horn','hornbill','hornet','horse','horseshoe','horsewhip','horsewoman','horticulturist','hostess','hotcake','hotdog','hotelier','hothead','hotshot','hound','houseboy','housecat','householder','hovercraft','howler','huckster','humpback','hunter','huntress','husky','hustler','hydra','hydrant','hyena','ibis','iceberg','icecube','icefish','iceman','iceskater','icon','igloo','iguana','insect','instrument','iron','islander','ivy','jacket','jaguar','jamjar','jar','javelin','jaw','jawbone','jellybean','jellyfish','jet','jetliner','jewel','jewelry','jigsaw','journal','joystick','judge','jug','juicer','jukebox','jumbojet','jumper','jumprope','junglecat','kangaroo','karateka','kayak','keg','keister','kennel','kestrel','kettle','key','keyboard','kickstand','kid','kingfisher','kisser','kitchensink','kite','kiteboarder','kitesurfer','kitten','kiwi','knapsack','kneepad','knife','knight','knob','koala','label','ladder','ladybird','ladybug','ladyfinger','ladyfish','ladykiller','lamp','landcrab','lantern','lanyard','laptop','lark','latch','lawyer','leaf','leafhopper','leech','leg','lemming','lemon','lemur','leopard','leopardess','lever','lightbulb','lighter','lilypad','limpet','lion','lioness','lionfish','lizard','llama','loadmaster','loaf','lobster','locknut','locksmith','locust','log','loudspeaker','louse','lovebird','lunchbox','lynx','macaw','machine','macho','magazine','magnet','mallard','mamba','mammal','man','manager','manatee','mango','manifest','map','marble','marmot','mascot','mat','mattress','mayfly','microscope','midge','mink','mirror','mite','model','molerat','mongoose','monitor','monkey','monument','moonwalker','moorhen','moose','moth','mother','motor','mountain','mouse','mouthpiece','mug','mullet','multiplier','mushroom','musician','musketeer','mussel','mystifier','nail','nameplate','napkin','nautilus','neck','necklace','nectarine','needle','net','newsman','newsreader','nighthawk','noodle','nose','notebook','nugget','numbat','nurse','nutcracker','oakleaf','oarfish','oatcake','obelisk','ocelot','octopus','officeboy','oilfish','olivetree','omelet','onion','opossum','optimist','orangutan','orca','orchestrator','organ','originator','ornament','osprey','ostrich','otter','outlander','oven','overpass','owl','oyster','pad','paddle','paddlefish','painter','palm','pan','pancake','panda','panther','paperboy','papertiger','parakeet','parchment','parkranger','parrot','passport','patron','peacock','pear','pebble','pelican','pen','pencil','penguin','percussionist','pharmacist','phone','photographer','physician','piano','pig','pigeon','piglet','pike','pillow','pillowcase','pintail','pipe','pizza','plane','plant','planthopper','plate','platypus','playboy','player','playground','polecat','pollock','pomegranate','pondslider','poodle','popcorn','poppy','porpoise','possum','poster','potato','pottery','pouch','prawn','professor','pug','puma','pumpkin','purse','pyramid','python','quadbike','quadruplet','quarter','quizbook','quizmaster','quizshow','quote','rabbit','raccoon','racerunner','radio','rainbow','rake','rancher','rat','rattlesnake','ray','razor','refrigerator','reindeer','resident','respondent','reviewer','reward','ring','ringleader','riverboat','rivet','roach','roadwarrior','robin','robot','rock','rockclimber','roller','rollerball','rollerskater','roomie','root','rootworm','ropewalker','rose','rottweiler','rug','rulebook','ruler','salamander','salesman','salmon','saltfish','sandbag','sandcat','sandfish','sandfox','sandhog','sandhopper','sandwich','sardine','sawfish','saxophone','scallop','schemer','schoolboy','schoolmaster','schoolmistress','scissorbill','scorpion','seal','senator','settler','shackle','shark','shebear','sheep','sheepdog','sheepman','sheepshead','shell','shellfish','shewolf','shield','ship','shipbuilder','shipmaster','shipowner','shipworm','shirt','shoe','shoemaker','shoulder','shovel','showgirl','showjumper','shrimp','sign','singer','sink','sister','skate','skateboard','skipper','skirt','skunk','skyflower','skyscraper','sloth','slug','smartphone','smirker','smokestack','snail','snapper','snowman','soap','sockpuppet','sofa','soupspoon','spaceship','spacewalker','spadefish','sparrow','spider','sponge','spoon','squid','squirrel','stabilizer','stairclimber','stakeholder','stallion','star','starling','stinkbug','stomach','stone','stonefly','stork','stove','stowaway','strawberry','streamer','street','sturgeon','submarine','suit','suitcase','sunbather','sunbird','supermarket','surgeonfish','swallow','swan','sweater','swift','swimmingpool','table','tablespoon','tailorbird','tailorfish','tangerine','tardigrade','taskmaster','tattooist','taxi','teabag','teacher','teacup','teakettle','tealeaf','teammate','teamplayer','teapot','teen','telecommuter','telepath','telephone','tenant','tentacle','termite','terraformer','terrier','tester','texter','theater','therapist','thumb','tick','tie','tiger','tigress','tilefish','tire','toad','toadfish','toe','token','tomato','tongue','toothbrush','toothpaste','tortoise','toucan','towel','townplanner','toy','tractor','train','trainer','trampoline','tree','trenchcoat','trespasser','trophy','trout','truck','tube','tunneler','turbocharger','turbojet','turtle','twinflower','ukulele','umbrella','uncle','undercoat','undergrad','uniform','unit','unpacker','user','utensil','utilitycart','vacuum','valuator','van','vase','vaseflower','vault','vegetable','vehicle','ventilator','vest','veterinarian','videogamer','viewer','viking','villager','violin','violinist','viper','visor','volcano','volcanologist','volleyball','voltagemeter','volunteer','vulture','wagon','waiter','walker','wall','wallaby','wallet','walrus','warbler','warlock','washingmachine','wasp','wastebasket','watch','waterfall','watermelon','watertank','weasel','weekender','weightlifter','whale','wheel','wheelchair','whip','whisker','wife','wildcat','windmill','window','wineglass','wing','witch','witness','wolf','wolverine','woman','wombat','wonderer','woodchuck','woodcutter','woodlander','woodlark','woodmouse','woodpecker','woodpigeon','woodsman','woodturner','woodwasp','woodworker','woolgrower','wordsmith','workbook','worker','workhorse','workman','workmate','worktable','worm','wowser','wrangler','wrench','wriggler','wrist','wristguard','wristwatch','writer','wunderkind','xenologist','xfactor','xylophone','yacht','yak','yam','yardbird','yardlamp','yardmaster','yardstick','yarn','yearbook','yellowback','yellowbird','yellowfin','yellowhammer','yellowjacket','yieldsign','yodeler','yogamat','yogi','yoyo','zebra','zebrafish','zebramule','zephyr','zeppelin','zester','zillionaire','zipfile','ziplock','zipper','zodiacsign','zookeeper','zoologist','zucchini'];

    // Your 20 color names (lowercase, ASCII)
    const COLORS = [
        'acrylic','aluminum','amber','ancient','antique','aquamarine','azure','basic','beige','big','biological','blue','bluish','boxy','brittle','bronze','brownish','brushed','camouflaged','cardboard','ceramic','checkered','chocolate','classic','clay','colossal','compact','concrete','conical','conventional','copper','crimson','crystal','curved','cyan','denim','dotted','elongated','enormous','expensive','fibrous','flat','fluffy','fossilized','fresh','futuristic','fuzzy','giant','gigantic','glossy','gold','golden','granite','green','greenish','grey','greyish','huge','immense','indigo','industrial','iron','ivory','jagged','jumbo','juvenile','knitted','large','latex','leathery','little','long','lopsided','magenta','marbled','massive','medieval','metallic','microscopic','mini','miniature','modern','nano','navy','necessary','neongreen','newborn','orange','organic','oval','petite','pink','pinkish','pinstriped','plastic','platinum','plush','pocketsized','pointy','polkadotted','polymeric','porcelain','porous','prehistoric','purple','purplish','quick','rapid','recycled','red','reddish','refurbished','relevant','restored','retro','ribbed','rough','round','rubber','ruby','sapphire','sensitive','shiny','silky','silver','silvery','slender','slim','small','soft','speckled','spotted','steel','stony','strategic','striped','styrofoam','synthetic','tan','tapered','teal','terracotta','textured','timeless','tiny','titanium','towering','turquoise','ultraviolet','velvet','velvety','vintage','violet','visual','weathered','wooden','woolly','woven','wrapped','yellow','zebrastriped'
    ];

    // A curated ASCII city list (Title Case; spaces allowed — we hyphenate when showing)
    const CITIES = [
        'Adelaide','Alexandria','Amsterdam','Ankara','Antwerp','Athens','Atlanta','Auckland','Austin','Baltimore','Bangkok','Barcelona','Belfast','Belgrade','Berlin','Bogota','Bologna','Boston','Brasilia','Brisbane','Bristol','Brussels','Bucharest','Budapest','Buenos Aires','Cairo','Calgary','Cape Town','Casablanca','Charlotte','Chiang Mai','Chicago','Cologne','Colorado','Columbus','Copenhagen','Dallas','Delhi','Denver','Detroit','Dublin','El Paso','Fort Worth','Frankfurt','Fresno','Geneva','Glasgow','Hamburg','Havana','Helsinki','Houston','Indiana','Indianapolis','Istanbul','Jacksonville','Jaipur','Jakarta','Johannesburg','Kansas','Kolkata','Kuala Lumpur','Las Vegas','Lima','Lisbon','Liverpool','London','Los Angeles','Louisville','Lyon','Madrid','Manaus','Manchester','Manhattan','Manila','Marrakech','Marseille','Melbourne','Memphis','Mesa','Mexico','Miami','Milan','Milwaukee','Mombasa','Montreal','Mumbai','Munich','Nagoya','Nairobi','Naples','Nashville','New York','Newcastle','Oklahoma','Omaha','Osaka','Oslo','Ottawa','Panama','Paris','Perth','Philadelphia','Phoenix','Portland','Porto','Prague','Pretoria','Raleigh','Riga','Rio','Rome','Rotterdam','Sacramento','San Antonio','San Diego','San Francisco','San Jose','Santa Cruz','Santiago','Sao Paulo','Seattle','Seoul','Singapore','Stockholm','Sydney','Taipei','Tbilisi','Tokyo','Toronto','Toulouse','Tucson','Turin','Valencia','Vancouver','Vienna','Warsaw','Washington','Winnipeg','Zagreb','Zurich'
    ];

    // ── UI state ────────────────────────────────────────────────────────────────
    let master = '';
    let showing = false;
    let stamp = '';
    let detail = null;
    let seq = 0;
    let inputEl;

    const enc = new TextEncoder();
    const U16 = (a,b) => ((a & 0xff) << 8) | (b & 0xff);
    const pad4 = (n) => n.toString().padStart(4,'0');
    const toKebab = (s) => s.replace(/\s+/g,'-');

    onMount(() => setTimeout(() => inputEl?.focus({ preventScroll: true }), 0));

    async function updateStamp() {
        const cur = ++seq;
        const m = master.trim();
        if (!m) { stamp=''; detail=null; return; }

        // H = SHA256("pb:v1:stamp" || 0x00 || master)
        const tag = enc.encode('pb:v1:stamp');
        const body = enc.encode(m);
        const buf = new Uint8Array(tag.length + 1 + body.length);
        buf.set(tag, 0); buf[tag.length] = 0x00; buf.set(body, tag.length+1);
        const digest = await crypto.subtle.digest('SHA-256', buf);
        if (cur !== seq) return;

        const H = new Uint8Array(digest);

        const v0 = U16(H[0], H[1]); // adjective
        const v1 = U16(H[2], H[3]); // noun
        const v2 = U16(H[4], H[5]); // number
        // const cidx = H[6] % COLORS.length;             // color from 8-bit
        const cidx = U16(H[6], H[7]) % COLORS.length; // color from 16-bit
        const cityIdx = U16(H[8], H[9]) % CITIES.length; // city from 16-bit

        const adj  = ADJ.length  ? ADJ[v0 % ADJ.length]   : '(no-adj)';
        const noun = NOUN.length ? NOUN[v1 % NOUN.length] : '(no-noun)';
        const color = COLORS[cidx];
        const city  = CITIES[cityIdx];
        // const num4  = pad4(v2 % 10000);
        const num4  = 1000 + (v2 % 2000);

        stamp = `${adj}-${color}-${noun}-in-${toKebab(city)}-${num4}`;
        detail = { adj, color, noun, city, num4, adjIdx: v0 % ADJ.length, nounIdx: v1 % NOUN.length, cityIdx, cidx };
    }

    async function copyStamp() {
        if (!stamp) return;
        try { await navigator.clipboard.writeText(stamp); } catch {}
    }
</script>

<svelte:head>
    <title>PassBooster — Stamp Test (color & city)</title>
</svelte:head>

<main class="container py-4">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h1 class="h4 mb-3">Stamp Test</h1>

                    <label class="form-label">Master passphrase</label>
                    <div class="input-group">
                        <input
                                class="form-control"
                                type={showing ? 'text' : 'password'}
                                bind:value={master}
                                bind:this={inputEl}
                                on:input={updateStamp}
                                placeholder="Type here… (stamp updates live)"
                                autocomplete="off"
                        />
                        <button class="btn btn-outline-secondary" type="button" on:click={() => (showing = !showing)}>
                            {showing ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div class="form-text">
                        Uses: adjective (|ADJ|={ADJ.length}), noun (|NOUN|={NOUN.length}), color ({COLORS.length}), city ({CITIES.length}), number (0000–9999).
                    </div>

                    <hr class="my-3" />

                    <div>
                        <div class="text-muted mb-1">Stamp <button class="btn btn-sm btn-outline-secondary" on:click={copyStamp} disabled={!stamp}>Copy</button></div>
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <code class="fs-6">{stamp || '(empty)'}</code>
                        </div>
                        {#if detail}
                            <div class="mt-2 small text-muted">
                                adj <code>{detail.adj}</code> (#{detail.adjIdx}),
                                color <code>{detail.color}</code> (#{detail.cidx}),
                                noun <code>{detail.noun}</code> (#{detail.nounIdx}),
                                city <code>{detail.city}</code> (#{detail.cityIdx}),
                                number <code>{detail.num4}</code>
                            </div>
                        {/if}
                    </div>

                    <div class="alert alert-info mt-3 mb-0 small">
                        <strong>Derivation:</strong>
                        <div><code>H = SHA256("pb:v1:stamp" || 0x00 || master)</code></div>
                        <div>
                            adj=<code>ADJ[U16(H[0..1]) % |ADJ|]</code>,
                            noun=<code>NOUN[U16(H[2..3]) % |NOUN|]</code>,
                            num=<code>(U16(H[4..5]) % 10000)</code>,
                            color=<code>COLORS[H[6] % 20]</code>,
                            city=<code>CITIES[U16(H[7..8]) % |CITIES|]</code>.
                        </div>
                    </div>

                </div>
            </div>

            <div class="text-center mt-3">
                <a class="link-secondary" href="#/generate">← Back to Generate</a>
            </div>
        </div>
    </div>
</main>
