import type { Intent, L10n, Personality } from './types'

const L = (th: string, en: string): L10n => ({ th, en })

type Pack = { up: L10n[]; down: L10n[] }

function pack(up: [string, string][], down: [string, string][]): Pack {
  return { up: up.map(([th, en]) => L(th, en)), down: down.map(([th, en]) => L(th, en)) }
}

export const GREET: Record<Personality, L10n[]> = {
  grandma: [
    L('โอ๊ย ลูก ยายนึกว่าแมวกดโทรศัพท์อีกแล้ว', 'Oh sweetheart, I thought the cat sat on the phone again.'),
    L('สวัสดีจ้ะ ยายกำลังรดโหระพาอยู่ คุยเบาๆ นะ', 'Hello dear. I am watering the basil. Use your indoor voice.'),
  ],
  crypto: [
    L('ว่ามา ถ้าไม่มูนภายในหนึ่งประโยค กูวาง', 'Talk. If this does not moon in one sentence I am gone.'),
    L('อย่าเป็นสายหน่วยงาน นี่กลุ่มลับเหรียญฮอนค์', 'Do not be a suit. This is a private HONK coin circle.'),
  ],
  executive: [
    L('คุณมีหนึ่งประโยค ปฏิทินผมผิดหวังอยู่แล้ว', 'You have one sentence. My calendar is already disappointed.'),
    L('พูดให้จบก่อนสัญญาณลิฟต์ ผมไม่ได้มีทั้งวัน', 'Finish before the elevator dings. I do not own a whole day.'),
  ],
  novice: [
    L('หนูเพิ่งเปิดคอมเป็นเมื่อปีที่แล้ว แล้วจอฟ้า หนูร้องไห้', 'I learned the power button last year. Then the screen went blue and I cried.'),
    L('ฮัลโหล… นี่สายช่วยเหลือใช่ไหม หนูอยู่บ้านคนเดียว', 'Hello… is this the helper line? I am home alone with the computer.'),
  ],
  uncle: [
    L('รหัสมันอยู่ในนก นกคือรัฐบาล รัฐบาลคือนก', 'The code is in the bird. The bird is the government. The government is a bird.'),
    L('อย่าวางสาย ป้าผมเป็นจานบินเมื่อวันอังคาร', 'Do not hang up. My aunt was a flying saucer last Tuesday.'),
  ],
  scambaiter: [
    L('ได้ๆ ผมพร้อมมาก เดี๋ยวเปิดทูลบาร์ให้สิบสี่อัน', 'Sure, sure. I am extremely ready. Let me open fourteen toolbars.'),
    L('ผมอ่านรหัสให้ แต่ขอติดตั้งอะไรบางอย่างก่อนสี่สิบนาที', 'I will read a code, right after a forty-minute install.'),
  ],
}

const ALL: Record<Personality, Record<Intent, Pack>> = {
  grandma: {
    greet: pack(
      [['ยายยิ้มแล้วจ้ะ คุยต่อได้', 'I am smiling. Keep talking.']],
      [['เสียงรีบไปหน่อยนะลูก', 'That hello was in a hurry, dear.']],
    ),
    reassure: pack(
      [
        ['ใจชื้นเลย ยายเชื่อว่าเป็ดยางไม่กัด', 'I feel better. Rubber ducks do not bite.'],
        ['ขอบคุณที่พูดช้า ยายตามทัน', 'Thank you for going slow. I can follow.'],
      ],
      [['คำว่าปลอดภัยเยอะไป ยายเริ่มนับช้อน', 'That is a lot of “safe.” I am counting spoons.']],
    ),
    urgency: pack(
      [['โอ๊ย รีบได้ แต่ยายยังถือสายยางอยู่', 'I can hurry, but I am still holding the hose.']],
      [
        ['อย่าเร่งยาย ต้นไม้ตกใจ', 'Do not rush me. The plants are startled.'],
        ['หมดเวลาอะไร ยายมีทั้งบ่าย', 'Expires? I have the whole afternoon.'],
      ],
    ),
    authority: pack(
      [['กรมอะไรก็ได้ลูก ยายเชื่อคนสุภาพ', 'Any department is fine if it is polite.']],
      [['ใช้คำว่ากรมแล้วเสียงแข็งไปนะ', 'That “department” voice got sharp.']],
    ),
    flattery: pack(
      [
        ['โอ้โฮ ยายเขิน คุกกี้เสกทางสายให้เลย', 'Oh I am blushing. Have a cookie through the phone.'],
        ['เสียงเพราะแบบนี้ ยายยกสวนให้', 'A voice that sweet can have the garden.'],
      ],
      [['ประจบแรง ยายไม่ใช่ไมค์', 'That flattery is too loud. I am not a microphone.']],
    ),
    ask_code: pack(
      [['ถามรหัสสุภาพดี จ้ะ เดี๋ยวหาแว่น', 'A polite code question. Let me find my glasses.']],
      [['ยังไม่พร้อมอ่านจ้ะ ใจยายยังไม่ถึง', 'I am not ready to read it. My heart is not there yet.']],
    ),
    confuse: pack(
      [['หา? ยายได้ยินแต่คำว่าเป็ด', 'Pardon? I only heard the word duck.']],
      [['พูดใหม่ได้ไหม ยายงงทั้งกระถาง', 'Say that again? I am confused in every pot.']],
    ),
    insult: pack(
      [['ยายวางสายได้นะ แมวก็ว่า', 'I can hang up. Even the cat agrees.']],
      [['พูดแบบนี้ไม่ได้นะลูก ยายเสียใจ', 'Do not talk like that. I am hurt.']],
    ),
  },
  crypto: {
    greet: pack(
      [['จัดมา อย่าเบิ้ม', 'Go. Do not fumble it.']],
      [['สวัสดียาวไป เหรียญร่วงระหว่างนั้น', 'That greeting was long enough for a dip.']],
    ),
    reassure: pack(
      [['ชิลได้ แต่ชิลไม่ทำกำไร', 'Calm is fine. Calm does not pump.']],
      [['อย่าปลอบ กูไม่ได้ถือถุงผ้า', 'Do not soothe me. I am not holding a tote bag.']],
    ),
    urgency: pack(
      [
        ['นี่ไง จังหวะเข้า ก่อนมันจาม', 'There it is. Entry, before the sneeze.'],
        ['รีบคือภาษาแม่ของเหรียญฮอนค์', 'Hurry is HONK’s native language.'],
      ],
      [['เร่งแบบหน่วยงาน ไม่เอา', 'That rush sounded like a bureau. No.']],
    ),
    authority: pack(
      [['มีตราประทับ? น่าเบื่อ', 'A stamp? Boring.']],
      [
        ['กรมอะไร อย่าแตะพอร์ตกู', 'A department? Stay off the bag.'],
        ['คำว่านโยบายทำให้เหรียญอ้วก', 'The word policy makes the coin gag.'],
      ],
    ),
    flattery: pack(
      [['คำชมรับได้ถ้าราคายังเขียว', 'Compliments are fine while the chart is green.']],
      [['อย่ามาอ้อน ไปอ่านกราฟ', 'Do not swoon. Read the chart.']],
    ),
    ask_code: pack(
      [['ถามโค้ดตรงๆ ดี เดี๋ยวผมอ่าน', 'Direct code ask. I will read it.']],
      [['ยังไม่บอก ยังไม่เชื่อว่าคุณอยู่ในกราฟ', 'Not yet. I do not believe you are in the chart.']],
    ),
    confuse: pack(
      [['ประโยคนั้นไม่มีทิศ', 'That sentence had no direction.']],
      [['พูดใหม่ เป็นภาษาเหรียญ', 'Again. In coin.']],
    ),
    insult: pack(
      [['วางสาย ไปฟาร์มอย่างอื่น', 'Hanging up. Farm somewhere else.']],
      [['คำนี้ทำให้พอร์ตแดง', 'That word turned the bag red.']],
    ),
  },
  executive: {
    greet: pack(
      [['ได้ สิบวินาที เริ่ม', 'Fine. Ten seconds. Start.']],
      [['ทักทายยาว ผมหักเวลาคุณแล้ว', 'A long hello. I deducted it from your time.']],
    ),
    reassure: pack(
      [['รับทราบว่าไม่ระเบิด', 'Noted that nothing explodes.']],
      [['อย่าปลอบผู้บริหาร มันเสียเวลา', 'Do not comfort an executive. It wastes time.']],
    ),
    urgency: pack(
      [
        ['ดี เร็วเข้าเรื่อง', 'Good. Faster. The point.'],
        ['เส้นตายชัด ผมฟัง', 'A clear deadline. I am listening.'],
      ],
      [['เร่งโดยไม่มีวาระ เลิก', 'Urgency with no agenda. Stop.']],
    ),
    authority: pack(
      [
        ['มีหน่วยงานชัด ผ่านด่านแรก', 'A named office. You cleared the first gate.'],
        ['ตามระเบียบสั้นๆ แบบนี้ผมโอเค', 'Short policy. I can live with it.'],
      ],
      [['อำนาจที่พูดอ้อม ผมไม่เซ็น', 'Authority that rambles does not get a signature.']],
    ),
    flattery: pack(
      [['ชมได้หนึ่งคำ เกินนั้นคือสไลด์', 'One compliment. More than that is a slide.']],
      [
        ['อย่าชมเสียงผม ผมจ่ายค่าที่ปรึกษาไม่พอ', 'Do not compliment my voice. I underpay consultants.'],
        ['ประจบทำให้ประชุมยาว', 'Flattery makes the meeting longer.'],
      ],
    ),
    ask_code: pack(
      [['ถามรหัสแบบบรรทัดเดียว ดี', 'A one-line code request. Good.']],
      [['ยังไม่ถึงขั้นอ่านรหัส', 'We are not at the reading stage.']],
    ),
    confuse: pack(
      [['ประโยคนี้เข้าประชุมไม่ได้', 'That sentence cannot enter the meeting.']],
      [['พูดใหม่ ไม่มีคำฟู', 'Again. No fluff.']],
    ),
    insult: pack(
      [['จบสาย ฝ่ายกฎหมายการ์ตูนจะยิ้ม', 'Call over. Cartoon legal will smile.']],
      [['คำหยาบไม่ใช่วาระ', 'An insult is not an agenda item.']],
    ),
  },
  novice: {
    greet: pack(
      [['คุณเสียงใจดี หนูไม่กลัวแล้ว', 'You sound kind. I am less scared.']],
      [['ทักแรงไป หนูเผลอวางเมาส์', 'That hello was loud. I dropped the mouse.']],
    ),
    reassure: pack(
      [
        ['โล่งมาก หนูหายอยากปิดฝาคอม', 'I am so relieved I no longer want to shut the lid.'],
        ['พูดช้าแบบนี้หนูตามทัน', 'That pace I can follow.'],
      ],
      [['คำปลอบเยอะไปหนูยิ่งงง', 'Too much comfort. I am more lost.']],
    ),
    urgency: pack(
      [['หนูรีบได้ แต่ขอทีละปุ่ม', 'I can hurry, one button at a time.']],
      [
        ['อย่าเร่ง หนูจะกดผิดแล้วร้อง', 'Do not rush me. I will press the wrong thing and cry.'],
        ['หมดเวลาทำให้มือหนูสั่น', 'Deadlines make my hands shake.'],
      ],
    ),
    authority: pack(
      [['มีชื่อหน่วยงานหนูจดลงกระดาษโน้ตแล้ว', 'I wrote the office name on a sticky note.']],
      [['คำว่ากรมทำให้หนูนึกถึงใบสั่งการบ้าน', 'The word department reminds me of homework.']],
    ),
    flattery: pack(
      [
        ['ขอบคุณที่ว่าหนูเก่ง ทั้งที่หนูเพิ่งหาปุ่มพิมพ์เจอ', 'Thank you. I only just found the keyboard.'],
        ['หนูยิ้มใส่จอแล้ว', 'I smiled at the screen.'],
      ],
      [['ชมแล้วสั่งต่อทันที หนูเวียนหัว', 'A compliment and then an order. I am dizzy.']],
    ),
    ask_code: pack(
      [['หนูมีรหัสในโน้ตสีชมพู เดี๋ยวอ่าน', 'The code is on a pink note. I will read it.']],
      [['ยังไม่กล้าอ่าน กลัวอ่านผิด', 'I am not brave enough to read it yet.']],
    ),
    confuse: pack(
      [['หนูหลงตั้งแต่คำที่สาม', 'I got lost at word three.']],
      [['ขอใหม่เป็นขั้นหนึ่ง สอง สาม', 'Again, as step one, two, three.']],
    ),
    insult: pack(
      [['หนูวางสายนะ ไม่อยากโดนดุ', 'I am hanging up. I do not want to be scolded.']],
      [['คำนั้นแรง หนูหุบไมค์', 'That was mean. Mic down.']],
    ),
  },
  uncle: {
    greet: pack(
      [['สายนี้ปลอดภัยจากนกพิราบ', 'This line is safe from pigeons.']],
      [['สวัสดีแบบตรงไปตรงมา น่าสงสัย', 'A normal hello. Suspicious.']],
    ),
    reassure: pack(
      [['ใจเย็นคือกับดักที่สุภาพ', 'Calm is a polite trap. I respect it.']],
      [['ปลอบเก่งไป ผมยิ่งเชื่อว่ามีอุโมงค์', 'Too much comfort. Now I believe in the tunnel.']],
    ),
    urgency: pack(
      [['รีบได้ ก่อนนกเปลี่ยนรหัส', 'We can rush, before the birds rotate the code.']],
      [['เส้นตายคือสิ่งที่รัฐบาลนกชอบ', 'Deadlines are what the bird government loves.']],
    ),
    authority: pack(
      [['กรมเหรอ กรมก็เป็นปีกของจานบิน', 'A department? Departments are saucer wings.']],
      [
        ['อย่าโบกตรา ผมสะสมตราปลอมอยู่แล้ว', 'Do not wave a badge. I collect fake ones.'],
        ['นโยบายทำให้หูผมร้อน', 'Policy makes my ears hot.'],
      ],
    ),
    flattery: pack(
      [['ชมผมได้ ผมเป็นลุงที่เปิดรับคำชมและทฤษฎี', 'Compliment accepted. I collect those and theories.']],
      [['ประจบแบบฟอร์ม ผมได้กลิ่นกระดาษ', 'Form-letter flattery. I smell paper.']],
    ),
    ask_code: pack(
      [['ถามรหัสตรง ผมจะตอบอ้อมหนึ่งทีแล้วบอก', 'A direct ask. I will be oblique once, then tell you.']],
      [['รหัสยังไม่ยอมออกจากรัง', 'The code will not leave the nest yet.']],
    ),
    confuse: pack(
      [
        ['ประโยคนี้ไม่มีไวยากรณ์ ผมรักมัน', 'That sentence has no grammar. I love it.'],
        ['ยิ่งงง ยิ่งจริง', 'The more confused, the more true.'],
      ],
      [['งงแบบน่าเบื่อ ไม่ใช่งงแบบจักรวาล', 'A boring confusion, not a cosmic one.']],
    ),
    insult: pack(
      [['คำด่าทำให้จานบินบินหนี', 'Insults scare the saucer off.']],
      [['ผมจะไปด่ากับนกแทน', 'I will go argue with a bird instead.']],
    ),
  },
  scambaiter: {
    greet: pack(
      [['ทักได้ ผมกำลังเปิดหน้าต่างติดตั้ง', 'Hello. I am opening an installer.']],
      [['สวัสดียาวพอให้แถบเครื่องมืองอก', 'A hello long enough for a toolbar to sprout.']],
    ),
    reassure: pack(
      [['วางใจได้ ผมอ่านเงื่อนไขให้จนคุณหลับ', 'You can relax. I will read terms until you sleep.']],
      [['คำว่าปลอดภัยทำให้ผมอยากส่งไฟล์', 'The word safe makes me want to send a file.']],
    ),
    urgency: pack(
      [['รีบได้ แต่ขออัปเดตก่อนแปดรอบ', 'We can rush, after eight updates.']],
      [['ยิ่งเร่ง ผมยิ่งหาปุ่มทีละปุ่ม', 'The more you rush, the slower I click.']],
    ),
    authority: pack(
      [['กรมไหน ผมขอสำเนาเป็นเพลง', 'Which office? I need the copy as a song.']],
      [['ตราประทับเหรอ เดี๋ยวผมออกแบบใหม่', 'A badge? I will redesign it.']],
    ),
    flattery: pack(
      [['ชมต่อได้ ผมบันทึกไว้ในแฟ้มช้า', 'Keep complimenting. I am filing it slowly.']],
      [['คำชมไม่เร่งไฟล์ติดตั้งอยู่ดี', 'Compliments do not speed the installer.']],
    ),
    ask_code: pack(
      [['รหัสเหรอ มี แต่เป็นรหัสที่ผมเพิ่งแต่ง', 'A code? I have one. I invented it just now.']],
      [['ยังไม่บอก ขอคุยเรื่องแรมก่อน', 'Not yet. First, let us discuss RAM.']],
    ),
    confuse: pack(
      [['งงเหรอ ดี จะได้อยู่นาน', 'Confused? Perfect. We can stay a while.']],
      [['ผมอธิบายใหม่ตั้งแต่ปีพ.ศ. ที่ไม่มี', 'Let me explain again, starting from a year that does not exist.']],
    ),
    insult: pack(
      [['แรงได้ ผมยังไม่วาง ผมมีเวลาทั้งกะ', 'Be rude. I am staying. I have the whole shift.']],
      [['คำด่าถูกบันทึกในทูลบาร์ที่ห้า', 'That insult was saved into toolbar five.']],
    ),
  },
}

const FALLBACK = [L('สายซ่าอยู่นิดหนึ่ง', 'The line crackles.')]

export function reactLine(personality: Personality, intent: Intent, positive: boolean, roll: number) {
  const packFor = ALL[personality][intent]
  const list = (positive ? packFor.up : packFor.down).length
    ? positive
      ? packFor.up
      : packFor.down
    : FALLBACK
  const i = Math.abs(Math.floor(roll * list.length)) % list.length
  return list[i] ?? FALLBACK[0]
}

export function greetLine(personality: Personality, roll: number) {
  const list = GREET[personality]
  return list[Math.floor(roll * list.length) % list.length] ?? FALLBACK[0]
}

export const giftReveal = (code: string) =>
  L(`รหัสบัตรเป็ดยางคือ ${code} จ้ะ อย่าร้องฮอนค์ดังในออฟฟิศ`, `The rubber-duck voucher is ${code}. Honk quietly, the office pretends to be a library.`)

export const chunkReveal = (n: number, chunk: string) =>
  L(`พยางค์ที่ ${n} ของบิลการ์ตูนคือ ${chunk}`, `Cartoon invoice syllable ${n} is ${chunk}.`)

export const fineReveal = (code: string) =>
  L(`เลขยืนยันค่าปรับจอดความฝันคือ ${code} จอดเอียงหนึ่งร้อยยี่สิบองศา`, `Dream-parking confirmation is ${code}. The dream was parked at a hundred and twenty degrees.`)

export const lotteryReveal = (code: string) =>
  L(`เลขสลากขูดมงคลคือ ${code} ขูดเบาๆ อย่าขูดโต๊ะ`, `The lucky scratch ticket is ${code}. Scratch the ticket, not the desk.`)

export const baitFake = () =>
  L('รหัสคือ BANANA-HAMMOCK ผมเพิ่งแต่งตอนคุณพูด รับทูลบาร์เพิ่มไหม', 'The code is BANANA-HAMMOCK. I made it up while you talked. Want another toolbar?')

export const coinStart = () => L('เข้าแล้ว ดูกราฟฮอนค์ อย่ากระพริบตา', 'I am in. Watch the HONK chart. Do not blink.')

export const coinCash = (amount: number) =>
  L(`ขายทัน ได้ ${amount} ก่อนมันจาม`, `Cashed out for ${amount} before the sneeze.`)

export const coinCrash = () => L('มันจามแล้ว! เงินกองเป็นขนเป็ด', 'It sneezed. The bag is now duck fluff.')

export const remoteOk = () => L('จอผมเปิดแล้ว อย่าไปเปิดรูปแมวทั้งหมดนะ', 'My cartoon desktop is open. Please do not open every cat.')

export const remoteDeny = () => L('ยังไม่ให้รีโมต ใจผมยังไม่ถึงปุ่มแชร์จอ', 'No remote yet. I have not reached the share button in my heart.')

export const remoteDecoy = () => L('นั่นไม่ใช่โน้ตรหัส นั่นรูปข้าวเย็น', 'That is not the note. That is a picture of dinner.')

export const remoteFound = (pin: string) => L(`เจอโน้ตแล้ว เลขบนกระดาษคือ ${pin}`, `You found the note. The scribble says ${pin}.`)

export const terminatedLine = () => L('วางสายดังป้าบ ความเชื่อใจหมดเกลี้ยง', 'Click. Trust is a crater. The line is dead.')

export const thanksLine = () => L('เรียบร้อย วันนี้คุณคือฮีโร่แผนกการ์ตูน', 'Done. You are the cartoon-floor hero of the hour.')

export const wrongLine = () => L('รหัสไม่ตรง ใจผมถอยหนึ่งก้าว', 'That code does not match. My trust takes a step back.')

export const walkedLine = () => L('หมดเวลา ผมเข้าประชุมต่อ โชคดีกับโควต้า', 'Time is up. I have another meeting. Good luck with the quota.')

export const missedLine = () => L('ไม่มีคนรับ เขาวางหูใส่สายว่าง', 'Nobody answered. They left the phone singing to itself.')

export const BOSS: Record<string, L10n> = {
  idle: L('หัวหน้าบิ๊ก: เมาส์ไม่ขยับ อย่าวาดรูปทั้งที่โควต้ายังไม่หายใจ', 'BOSS BIG: The mouse is napping. Quit doodling while the quota is flatlining.'),
  missed: L('หัวหน้าบิ๊ก: สายหลุด หูคุณเป็นของตกแต่งหรือไง', 'BOSS BIG: You let it ring out. Are those ears decorative?'),
  dropped: L('หัวหน้าบิ๊ก: วางสายทั้งที่มือว่าง เก่งเรื่องแพ้', 'BOSS BIG: Hung up with empty hands. A talent for losing.'),
  behind: L('หัวหน้าบิ๊ก: โควต้าคลานเหมือนเต่าใส่บูท ผมจะจับเครื่องกาแฟเป็นตัวประกัน', 'BOSS BIG: The quota is crawling. I am taking the coffee machine hostage.'),
  bait: L('หัวหน้าบิ๊ก: นั่นกลิ่นเบท วางสายก่อนทูลบาร์ลงจอด', 'BOSS BIG: That smells like bait. Hang up before the toolbars land.'),
  virus: L('หัวหน้าบิ๊ก: ไวรัสอีกแล้ว ไอทีลาออกไปเปิดฟาร์มเป็ด กักกันเอง', 'BOSS BIG: Virus. IT quit to farm ducks. Quarantine it yourself.'),
  hold: L('หัวหน้าบิ๊ก: กดโฮลด์อีกแล้ว เพลงรอสายยื่นใบลาออก', 'BOSS BIG: Hold again. The hold music just resigned.'),
  terminated: L('หัวหน้าบิ๊ก: เขาตัดสายใส่หน้าคุณ ดังไปทั้งชั้น', 'BOSS BIG: They hung up on your face. The whole floor heard it.'),
  start: L('หัวหน้าบิ๊ก: นั่งลง ใส่หู ยิ้มให้ไมค์ โควต้าไม่สนความรู้สึก', 'BOSS BIG: Sit. Headset. Smile at the mic. The quota has no feelings.'),
}

export const REVIEW_BOSS: Record<'proud' | 'ok' | 'fired', L10n> = {
  proud: L('หัวหน้าบิ๊ก: ได้ วันนี้ผมไม่กินโต๊ะ', 'BOSS BIG: Fine. The desk lives another day.'),
  ok: L('หัวหน้าบิ๊ก: ผ่านแบบเฉียดหมวก อย่าเอากรอบรูป', 'BOSS BIG: You passed by the brim of a hat. Do not frame it.'),
  fired: L('หัวหน้าบิ๊ก: เก็บกระบอกหู บัตรหมดอายุวันนี้', 'BOSS BIG: Headset on the desk. Your badge dies today.'),
}

export const VIRUS_ADS: { title: L10n; body: L10n; fake: L10n }[] = [
  {
    title: L('อัปเดตเครื่องปิ้งขนมปัง', 'Toaster firmware'),
    body: L('เครื่องปิ้งติดแยมร้าย คลิกเพื่อทาเพิ่ม', 'Your toaster caught jam malware. Click to spread more jam.'),
    fake: L('รับแยมฟรี', 'Claim free jam'),
  },
  {
    title: L('แรมฟรีจากลุง', 'Free RAM from a stranger'),
    body: L('ดาวน์โหลดแรมสามสิบสองก้อนใส่ในหู', 'Download thirty-two sticks of RAM directly into your ear.'),
    fake: L('ใส่แรมเลย', 'Install RAM'),
  },
  {
    title: L('ฮอนค์คอยน์แจกหมวก', 'HONK is giving hats'),
    body: L('หมวกนี้มีไวรัสปีก อย่าลองสวม', 'This hat has wings and a virus. Do not try it on.'),
    fake: L('ใส่หมวก', 'Wear the hat'),
  },
  {
    title: L('คุณชนะถุงเท้า', 'You won socks'),
    body: L('กรอกที่อยู่เพื่อรับถุงเท้าที่เดินได้', 'Enter an address to receive socks that walk away.'),
    fake: L('รับถุงเท้า', 'Accept socks'),
  },
]

export const NAMES: Record<
  Exclude<Personality, 'scambaiter'>,
  { th: string; en: string; avatar: string; bio: L10n }[]
> = {
  grandma: [
    { th: 'ยายมาลี', en: 'Granny Mali', avatar: '👵', bio: L('เชื่อคนสุภาพ และเชื่อแมว', 'Trusts polite voices and the cat.') },
    { th: 'ป้าสมศรี', en: 'Aunt Somsri', avatar: '🌷', bio: L('รดน้ำต้นไม้ระหว่างสาย', 'Waters plants mid-call.') },
  ],
  crypto: [
    { th: 'บิทบอย', en: 'Bitboy', avatar: '🧢', bio: L('พูดเป็นกราฟ', 'Speaks in charts.') },
    { th: 'น้องมูน', en: 'Moonkid', avatar: '🌙', bio: L('กลัวคำว่ากรม', 'Allergic to departments.') },
  ],
  executive: [
    { th: 'คุณวิทย์', en: 'Mr. Wit', avatar: '💼', bio: L('ให้เวลาหนึ่งประโยค', 'Budgets one sentence.') },
    { th: 'คุณเวลา', en: 'Ms. Clock', avatar: '⏱️', bio: L('ประชุมกินเวลาสาย', 'Meetings eat the call.') },
  ],
  novice: [
    { th: 'น้องน็อต', en: 'Nut', avatar: '🐣', bio: L('เพิ่งหาปุ่มพิมพ์เจอ', 'Just found the keyboard.') },
    { th: 'หนูแพร', en: 'Prae', avatar: '📎', bio: L('จดทุกอย่างลงโน้ตสีชมพู', 'Writes everything on pink notes.') },
  ],
  uncle: [
    { th: 'ลุงทฤษฎี', en: 'Uncle Theory', avatar: '🛸', bio: L('เชื่อว่ารัฐบาลเป็นนก', 'Believes the government is a bird.') },
    { th: 'ปู่รหัส', en: 'Grandpa Cipher', avatar: '🦉', bio: L('ซ่อนเลขไว้ในเรื่องนก', 'Hides numbers inside bird stories.') },
  ],
}
