// 「ぬりえ」の絵（すべてこのアプリ用に描いたもの）。大きさは 200×200。
// class="r" … タップすると色がぬれる場所
// class="d" … 線だけの飾り（ぬれない）／ class="e" … 目などの黒い点（ぬれない）
// k は読み上げる声の名前（voice_script.tsv のキー）。
(() => {
const sunRays = [0,45,90,135,180,225,270,315]
  .map(a => `<polygon class="r" points="100,8 113,44 87,44" transform="rotate(${a} 100 100)"/>`).join('');
const face = (x1, x2, y, my) =>
  `<circle class="e" cx="${x1}" cy="${y}" r="4.5"/><circle class="e" cx="${x2}" cy="${y}" r="4.5"/>` +
  `<path class="d" d="M${(x1+x2)/2-8} ${my} Q${(x1+x2)/2} ${my+8} ${(x1+x2)/2+8} ${my}"/>`;

window.PICS = [
  { k: 'heart', svg:
    '<path class="r" d="M100 175 C 20 120 10 60 55 40 C 80 30 95 45 100 62 C 105 45 120 30 145 40 C 190 60 180 120 100 175Z"/>' +
    '<ellipse class="r" cx="62" cy="72" rx="15" ry="9" transform="rotate(-35 62 72)"/>' },
  { k: 'star', svg:
    '<polygon class="r" points="100,17 122.3,74.3 183.7,77.8 136.1,116.7 151.7,176.2 100,143 48.3,176.2 63.9,116.7 16.3,77.8 77.7,74.3"/>' +
    face(88, 112, 103, 114) },
  { k: 'circle', svg:
    '<circle class="r" cx="100" cy="100" r="80"/><circle class="r" cx="100" cy="100" r="42"/>' },
  { k: 'triangle', svg:
    '<polygon class="r" points="100,18 186,176 14,176"/><polygon class="r" points="100,90 138,152 62,152"/>' },
  { k: 'square', svg:
    '<rect class="r" x="22" y="22" width="156" height="156" rx="18"/><rect class="r" x="62" y="62" width="76" height="76" rx="10"/>' },
  { k: 'moon', svg:
    '<path class="r" d="M120 20 A82 82 0 1 0 172 148 A64 64 0 1 1 120 20Z"/>' +
    '<polygon class="r" points="160,30 166,46 182,52 166,58 160,74 154,58 138,52 154,46"/>' +
    '<path class="d" d="M62 98 q7 7 14 0"/><path class="d" d="M70 128 q8 6 16 0"/>' },
  { k: 'cloud', svg:
    '<path class="r" d="M48 138 C 20 138 18 98 46 94 C 44 62 86 50 102 72 C 116 44 166 52 162 92 C 190 94 190 138 160 138 Z"/>' +
    '<path class="r" d="M70 152 q-9 13 0 20 q9 -7 0 -20Z"/><path class="r" d="M104 156 q-9 13 0 20 q9 -7 0 -20Z"/><path class="r" d="M138 152 q-9 13 0 20 q9 -7 0 -20Z"/>' +
    face(88, 124, 110, 118) },
  { k: 'sun', svg:
    sunRays + '<circle class="r" cx="100" cy="100" r="52"/>' + face(84, 116, 94, 110) },
  { k: 'flower', svg:
    '<rect class="r" x="95" y="104" width="10" height="84" rx="5"/>' +
    '<ellipse class="r" cx="128" cy="158" rx="24" ry="11" transform="rotate(-30 128 158)"/>' +
    '<ellipse class="r" cx="72" cy="166" rx="22" ry="10" transform="rotate(30 72 166)"/>' +
    '<circle class="r" cx="100" cy="46" r="25"/><circle class="r" cx="132.3" cy="69.5" r="25"/><circle class="r" cx="120" cy="107.5" r="25"/>' +
    '<circle class="r" cx="80" cy="107.5" r="25"/><circle class="r" cx="67.7" cy="69.5" r="25"/><circle class="r" cx="100" cy="80" r="21"/>' },
  { k: 'butterfly', svg:
    '<path class="d" d="M96 62 Q86 36 74 30"/><path class="d" d="M104 62 Q114 36 126 30"/>' +
    '<ellipse class="r" cx="62" cy="78" rx="40" ry="32" transform="rotate(-20 62 78)"/><ellipse class="r" cx="138" cy="78" rx="40" ry="32" transform="rotate(20 138 78)"/>' +
    '<ellipse class="r" cx="72" cy="136" rx="27" ry="23"/><ellipse class="r" cx="128" cy="136" rx="27" ry="23"/>' +
    '<circle class="r" cx="60" cy="78" r="12"/><circle class="r" cx="140" cy="78" r="12"/>' +
    '<ellipse class="r" cx="100" cy="106" rx="10" ry="48"/>' },
  { k: 'fish', svg:
    '<polygon class="r" points="150,100 190,62 190,138"/>' +
    '<path class="r" d="M80 66 Q100 32 128 64Z"/>' +
    '<ellipse class="r" cx="96" cy="100" rx="66" ry="42"/>' +
    '<path class="r" d="M112 64 Q128 100 112 136 Q138 100 112 64Z"/>' +
    '<circle class="r" cx="60" cy="92" r="11"/><circle class="e" cx="58" cy="92" r="4.5"/><path class="d" d="M34 108 q8 6 14 0"/>' },
  { k: 'umbrella', svg:
    '<path class="d" style="stroke-width:8" d="M100 112 L100 168 Q100 186 84 186 Q70 186 70 172"/>' +
    '<path class="r" d="M18 112 A82 82 0 0 1 182 112 Q155 98 128 112 Q100 98 72 112 Q45 98 18 112Z"/>' +
    '<path class="r" d="M72 112 Q78 50 100 30 Q122 50 128 112 Q100 98 72 112Z"/>' +
    '<circle class="r" cx="100" cy="26" r="7"/>' },
  { k: 'mushroom', svg:
    '<path class="r" d="M72 112 Q66 175 80 182 L120 182 Q134 175 128 112Z"/>' +
    '<path class="r" d="M20 116 C 20 40 180 40 180 116 Q100 130 20 116Z"/>' +
    '<circle class="r" cx="68" cy="80" r="13"/><circle class="r" cx="116" cy="64" r="11"/><circle class="r" cx="146" cy="96" r="9"/>' +
    face(90, 110, 146, 158) },
  { k: 'rabbit', svg:
    '<ellipse class="r" cx="76" cy="56" rx="17" ry="44" transform="rotate(-8 76 56)"/><ellipse class="r" cx="124" cy="56" rx="17" ry="44" transform="rotate(8 124 56)"/>' +
    '<ellipse class="r" cx="76" cy="58" rx="7" ry="30" transform="rotate(-8 76 58)"/><ellipse class="r" cx="124" cy="58" rx="7" ry="30" transform="rotate(8 124 58)"/>' +
    '<circle class="r" cx="100" cy="130" r="58"/>' +
    '<circle class="r" cx="66" cy="146" r="10"/><circle class="r" cx="134" cy="146" r="10"/>' +
    '<circle class="e" cx="82" cy="124" r="5"/><circle class="e" cx="118" cy="124" r="5"/>' +
    '<ellipse class="e" cx="100" cy="138" rx="5" ry="4"/><path class="d" d="M92 146 Q100 153 108 146"/>' },
  { k: 'cat', svg:
    '<polygon class="r" points="44,104 56,30 98,70"/><polygon class="r" points="156,104 144,30 102,70"/>' +
    '<polygon class="r" points="58,84 62,50 82,70"/><polygon class="r" points="142,84 138,50 118,70"/>' +
    '<circle class="r" cx="100" cy="118" r="62"/>' +
    '<circle class="e" cx="80" cy="110" r="5"/><circle class="e" cx="120" cy="110" r="5"/>' +
    '<polygon class="e" points="94,124 106,124 100,131"/><path class="d" d="M88 138 Q94 144 100 138 Q106 144 112 138"/>' +
    '<path class="d" d="M40 120 L70 126 M40 138 L70 134 M160 120 L130 126 M160 138 L130 134"/>' },
  { k: 'car', svg:
    '<path class="r" d="M20 140 L20 110 Q20 98 34 96 L60 92 L82 60 Q86 54 96 54 L140 54 Q150 54 156 62 L176 92 Q186 96 186 110 L186 140 Z"/>' +
    '<polygon class="r" points="70,92 90,64 116,64 116,92"/><polygon class="r" points="124,64 146,64 164,92 124,92"/>' +
    '<circle class="r" cx="60" cy="145" r="21"/><circle class="r" cx="150" cy="145" r="21"/>' +
    '<circle class="r" cx="60" cy="145" r="8"/><circle class="r" cx="150" cy="145" r="8"/>' },
  { k: 'house', svg:
    '<rect class="r" x="134" y="32" width="22" height="44"/>' +
    '<polygon class="r" points="100,22 186,96 14,96"/>' +
    '<rect class="r" x="32" y="96" width="136" height="88"/>' +
    '<rect class="r" x="86" y="128" width="32" height="56" rx="4"/>' +
    '<rect class="r" x="46" y="112" width="28" height="28" rx="3"/><rect class="r" x="130" y="112" width="28" height="28" rx="3"/>' },
  { k: 'rocket', svg:
    '<path class="r" d="M82 160 Q100 204 118 160Z"/>' +
    '<polygon class="r" points="72,118 40,166 76,152"/><polygon class="r" points="128,118 160,166 124,152"/>' +
    '<path class="r" d="M100 16 C 136 45 140 100 130 160 L70 160 C 60 100 64 45 100 16Z"/>' +
    '<circle class="r" cx="100" cy="86" r="18"/><circle class="r" cx="100" cy="86" r="9"/>' },
  { k: 'cake', svg:
    '<ellipse class="r" cx="100" cy="178" rx="86" ry="12"/>' +
    '<rect class="r" x="30" y="110" width="140" height="64" rx="10"/>' +
    '<path class="r" d="M30 122 Q30 96 54 96 L146 96 Q170 96 170 122 Q155 134 140 122 Q125 134 110 122 Q95 134 80 122 Q65 134 50 122 Q40 132 30 122Z"/>' +
    '<rect class="r" x="92" y="52" width="16" height="44" rx="3"/>' +
    '<path class="r" d="M100 22 Q113 40 100 50 Q87 40 100 22Z"/>' +
    '<circle class="r" cx="58" cy="92" r="11"/><circle class="r" cx="142" cy="92" r="11"/>' },
  { k: 'cookie', voice: 'it_cookie', svg:
    '<circle class="r" cx="100" cy="100" r="78"/>' +
    '<circle class="r" cx="72" cy="74" r="10"/><circle class="r" cx="124" cy="66" r="9"/><circle class="r" cx="134" cy="118" r="11"/>' +
    '<circle class="r" cx="84" cy="128" r="9"/><circle class="r" cx="104" cy="98" r="8"/>' },
];
})();
