# 밝밤) 10월 26일 ~ 11월 3일 패치

## [원자력 발전소 터널에 보스 feral FPF commander 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10718)

원자력 발전소 지하 냉각 터널에 근접형 보스 feral FPF commander가 스폰함

회피가 매우 높아서 총으로 잡기 힘들지만 기관총 같은 고용량 무기면 가능함. 도약, 플레이어를 날려 보내는 드롭킥, 붙잡힌 상태에서만 큰 피해를 주는 처형 공격을 쓰고, 주기적으로 기절과 소량 피해를 주는 에너지 파동을 쏨

- 중후반 장비 드롭

- 마이크로리액터 + 업그레이드 드롭

- 붙잡히면 위험

![이성을 잃은 FPF 사령관](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ea99f2ee9bb5d1a57d5db5955b63e2b6d2f9487543f623007da6062767ffa48a.webp)

## [밴디트 캠프 두목이 전용 보스 NPC로 변경](https://github.com/cataclysmbn/Cataclysm-BN/pull/10734)

올드 가드(The Old Guard) 임무 4번에서 평범한 밴디트 대신 장비가 훨씬 좋은 두목이 나옴

재활용 파워 아머 풀세트에 군용 바이오닉을 달고 나옴. 소총 기술을 가장 우선으로 쓰며 M1919 Stinger, PKM 같은 기관총이나 유탄·로켓 발사기를 듦. 수류탄과 의료품도 일반 밴디트보다 잘 갖고 있음

- 재활용 파워 아머 착용

- 기관총·발사기 사용

- 아르카나·CRT 확장·마법의 밤 모드 사용 시 고급 무기 확률 추가

![밴디트 두목](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/3f75a6b425498e963c7ec0637ae3e1109e859404ae5d20e145dedcf5527f3814.webp)

## [방탄 조끼·방탄판 대규모 밸런스 조정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10737)

방탄 조끼와 방탄판의 방어 수치, 스폰, 제작법이 크게 바뀜

강철/합금 방탄판을 끼운 방탄 조끼가 설명대로 5.56mm를 막도록 두께를 4층에서 6층으로 올림. 스크랩 방탄판은 철로 취급되어 방탄 조끼와 함께 쓰면 .223 Remington을 막음. 경량 방탄 조끼는 plate carrier로 이름이 바뀌고 방탄 저항이 2에서 6으로 올라 제작법도 생김. 이후 금속 방탄판 두께를 줄여 타격/베기 저항을 낮춤(강철·초합금판 24/24 -> 18/18, 경화 강철판 16/28 -> 12/21)

- 드래곤 스킨 조끼는 lamellar ballistic vest로 바뀌어 단독 방어구가 됨

- 방탄 조끼 스폰이 민간용과 군용으로 나뉨

- 알루미늄·탄소섬유 기반 찌르기 방어판 추가

- ESAPI 방탄판 부피 5380ml -> 4L

## [전술 헬멧이 군용 헬멧보다 한 단계 위로](https://github.com/cataclysmbn/Cataclysm-BN/pull/10738)

전술 헬멧과 전술 풀 헬멧이 군용 헬멧보다 확실히 단단해짐

재질이 플라스틱에서 경화 강철로 바뀌어 탄도 저항이 50이 됨(군용 헬멧은 40). 군용 헬멧은 .40 S&W, 전술 헬멧은 .357 매그넘까지 막는 수준임. 생존용 헬멧은 군용 헬멧 또는 강철 전투 헬멧에 케블라를 더해 만들고, 중량형 생존용 헬멧은 전술 헬멧 계열로만 만듦

- 전술 헬멧 무게·방해도 증가

- 중량형 생존용 헬멧 저항 60

![헬멧 비교](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/a65374ba37f48cde73364de0dc3362907bde97fe63d4227c574e2bb0e49b6578.webp)

## [비상 대피소 주차 칸에 고장 난 차량 스폰, 감염 지하실 확률 증가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10755)

비상 대피소의 주차 칸(3칸)마다 25% 확률로 차량이 스폰함

차량은 항상 작동 불능이라 초중반 수리 목표가 됨. 몬스터가 나오는 감염 지하실 변종은 확률이 1/11에서 1/3으로 오르고, 몬스터가 아예 안 나오던 문제도 고침. 대신 몬스터는 판자로 막힌 문 뒤에 갇혀 있고 공기 필터는 벽에 박혀 있어 쉽게 부서지지 않음

- 대피소 2번형에서 차량 스폰 때 뒷벽이 부서지던 버그 수정

![대피소 주차장](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/b8fb454eb9123707317f0136b1bd2cd3890dd76bdeb6412974859d4699af3089.webp)

## [음식 부패 속도 설정 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10691)

설정에 ROT_RATE가 추가되어 음식과 시체가 썩는 속도를 조절할 수 있음

0배면 음식이 영원히 신선하고, 0.05배면 20배 느리게 썩음. 100배로 두면 1시간 만에 썩음

- 0배 = 부패 없음

- 0.05배 = 20배 느리게

- 100배 = 1시간 만에 썩음

![부패 속도 설정](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ed6095031060ae614148330a03bbef5c847f190e708813c922c83c16e368a3fd.png)

![100배 부패 속도](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/621764336b875007bbba9e1e8547873d8c574b68fe35cf3fdfcf122973a6d69f.webp)

## [방사능 좀비 진화 라인 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10785)

화생방 좀비가 glowing zombie로, 다시 radioactive husk로 진화함

둘 다 재생하며 빛을 내고 공격에 맞으면 방사능에 피폭됨. radioactive husk는 화염 면역에 독성 가스를 뿜고 능력치와 재생이 더 높음. 피해가 들어가면 방호구를 무시하고 피폭되며, 피해가 0이면 방호구가 막아 줌. 엘리트 과학자 좀비, 피폭된 방랑자, 그슬린 악몽, 진화한 돌연변이 실험체의 공격에도 방사능이 붙음

- 방사능 아이템과 옷 잔해 드롭

- 소형핵 드롭 무게는 후속 수정으로 하향

![방사능 좀비](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/d823a5ce78725734c3d71d7cbc93a9ef6129829d966e7bc01ab4f4a4b1beaa07.webp)

## [이성을 잃은 인간 진화 경로 추가, 지하실 첫날 스폰](https://github.com/cataclysmbn/Cataclysm-BN/pull/10724)

일반·군인 계열 이성을 잃은 인간에게 진화 경로가 생기고, 파이프·쇠지렛대·도끼 든 개체는 첫날부터 지하실에서 스폰함

일반형은 진화 시 40% 일반 좀비, 10% 생존자 계열 좀비, 50% 생존자형 개체가 됨. 군인형은 살아남으면 소총, 기관총, 산탄총, DMR을 들 수 있고 명중률은 원본보다 낮음. 체인톱 든 개체도 추가됐지만 등장 시기는 늦음

- 민병대원 점사 사격 제거

- 시작 탄약 증가: 보안요원 5 -> 15, 생존주의자 3 -> 15, 민병대원 10 -> 30

## [군사 병영 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10735)

DDA 0.I의 군사 전초기지를 이식한 병영이 월드에 생김

무장한 이성을 잃은 군인 3명이 경비를 섬. 정문 앞 차량 옆에 소총수, 지붕에 저격수, 무기고 앞에 산탄총수가 있음. 군사작전 지도에서 군용 비행장이 표시되지 않던 버그도 고침

- 소총수 / 저격수 / 산탄총수 배치

## [은퇴자 마을 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10769)

DDA의 대형 은퇴자 마을이 이식되어 도구 등 기본 물품과 지하실 고유 물품이 있음

스폰 확률은 원본 20에서 35로 높임. 원본의 EOC 컴퓨터는 빠짐

## [새 직업 Marine CSO 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10748)

특수부대원의 대안으로 쓸 수 있는 직업 Marine CSO가 추가됨

장비는 괜찮은 편이지만 무기는 M9 권총과 너클더스터뿐임. 군사 직업이 있는 시나리오와 연구소 직원 시나리오에도 들어감

- M9 + 너클더스터 시작

## [직업별 시작 탄약 종류 다양화](https://github.com/cataclysmbn/Cataclysm-BN/pull/10754)

군용 직업은 FMJ, 경찰 직업은 JHP 탄으로 시작함

탱크 승무원, 사보퇴르, Marine CSO는 M9에 9mm FMJ를 들고 시작함. 경찰 직업은 .223과 .308을 쓰고 군용은 AP 유지. 자동소총수는 일반 5.56mm 대신 예광탄으로 시작함

- 바이오닉 저격수 .45 FMJ

- 경찰 직업 .45 JHP

## [군인·SWAT·스켈레톤 좀비 방어력 조정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10780)

군용 계열 좀비 방어력이 현재 방어구 수치에 맞춰지고, 스켈레톤 계열은 근접에 훨씬 단단해짐

스켈레톤 저거너트 20/45/36 -> 36/45/27, 스켈레톤 브루트 12/30/24 -> 24/30/18, 스켈레톤 마스터 0/15/24 -> 20/30/20. 케블라 좀비 14/34/53 -> 18/23/53, Kevlar brute 18/45/70 -> 24/30/70, 케블라 헐크 30/56/90 -> 26/49/90. feral FPF commander는 38/53/62 -> 32/46/70

- 저거너트: 근접·활에 강하고 총탄에는 약함

- 스켈레톤 계열 찌르기 저항이 베기 저항과 같아짐

## [환각 전용 몬스터 hat man 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10792)

환각에서만 hat man이 등장함

움직이지 않고 몇 턴 뒤 사라지며, 회피가 매우 높아 사격으로 맞힐 수 없음. 공포로 플레이어를 마비시킬 수 있음

## [알파에 natural omnivore 변이 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10733)

알파 돌연변이 후반 단계에서 natural omnivore를 얻을 수 있음

정크 푸드 과민증을 제외한 모든 음식 알레르기를 상쇄함

## [시민 모드: 이성을 잃은 플레이어 시나리오에서 시민이 적대](https://github.com/cataclysmbn/Cataclysm-BN/pull/10721)

시민 모드와 이성을 잃은 플레이어 시나리오를 함께 쓰면 시민들이 플레이어를 적대함

이전엔 시민이 계속 우호적이라 시나리오 의미가 없었음. 이제 강제 특성으로 적대하고, 시작 계절도 여름이 아니라서 시민이 어느 정도 살아 있음. 생존자 아이의 볼라 재사용 대기시간도 늘려 거의 기절 고정이던 것을 완화함

## [접이식 탄소섬유 jerrycan 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10730)

탄소섬유로 만든 접이식 차량 연료통이 추가됨

기존 접이식 차량 탱크는 아주 작은 것 하나뿐이었음. 차량에 설치해 채우고 접었다 펼 수 있음

## [산탄 탄약 이름이 12x70mm 기준으로 통일](https://github.com/cataclysmbn/Cataclysm-BN/pull/10784)

산탄총 탄약 이름 앞에 12x70mm가 붙고, 산탄 탄피는 12x70mm 탄피로 바뀜

자동 줍기, 정렬, 검색에서 산탄 계열을 찾기 쉬워짐. 20x66mm와 .410은 따로 구분됨

## [체인톱은 켜야 벌목 도구로 사용](https://github.com/cataclysmbn/Cataclysm-BN/pull/10768)

꺼진 체인톱으로 나무를 베던 것을 막고, 켠 상태에서만 도끼 기능이 작동함

전기 전투 체인톱의 전력 소모가 일반형 수준으로 내려옴(기존 약 12배). 전기 체인톱의 시동 충전량은 5에서 1로 줄었고, 가솔린 체인톱과 전투 톱의 용량은 450에서 500으로 늘어남

## [차량 부품 물품·제작법 조정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10766)

경량 나무 바퀴 구동 장치의 무게와 부피가 2배가 되고, 경량 바퀴 구동 장치 제작법의 재료량이 물품 무게에 맞게 바뀜

탄소 시트, 탄소 프레임, 탄소 플레이트는 3D 프린팅 사용량이 각각 15, 30, 40으로 늘어남. 알루미늄판 제작에 망치 품질이 필요해짐

## [차량 피해 배율 상한 4.0](https://github.com/cataclysmbn/Cataclysm-BN/pull/10601)

월드 설정의 차량 피해 배율 범위가 4.0까지로 제한됨

4.0 이상에서는 부품이 전부 부서진 차량만 나왔음. 업데이트하면 기존 월드의 값이 1.0으로 돌아가니 다시 확인해야 함

![차량 피해 배율](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/ca065981c57fb6dafd37810e0dc1111088b466196733b16d47c5838e0ae6b7ae.webp)

## [크롭탑과 금목걸이 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10771)

크롭탑과 금목걸이가 추가되고, 프랫·소로리티·조폭 직업 의상에 반영됨

전당포와 상업지구 등에서도 나옴. 천 조각으로 티셔츠를 만들 수 없던 제작법 버그도 고침

## [바이오닉 분해 제작법 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10727)

바이오닉 약 20종을 분해해 재료를 얻을 수 있음

섬광 생성기, LED 타투, 방사선 선량계, 인공호흡기, 열 흡수기, 백혈구 배양 시스템, 전자석 장치, 제3의 눈꺼풀, 인공 심야 발생기, 감각 감쇄, 가능성 추진기, 공간이동 장치, 수중 추진기, 내부 저장고, 맛 수정기, 수면 유도기, 퓨전 블래스터 팔 등이 대상임

## [총기 부착물 스폰 비율 조정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10723)

어깨끈, 권총 고정끈 등 흔한 부착물은 덜 나오고 안정기는 더 자주 나옴

탄피받이, 어깨끈, 권총 고정끈과 AR-15/MCX 재툴 키트 등의 스폰 가중치가 10으로 줄었음(U 산탄총 부착물은 60에서). 안정기는 희귀 그룹에서 20으로 올랐음

## [개와 말 갑옷 크기 범위 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10720)

말 갑옷은 55~1000L, 개 갑옷은 1~55L 크기에 맞게 바뀜

중형 네발 동물용 갑옷을 운반로봇에 입힐 수 있고, 큰 개에게도 입힐 수 있음

## [MK 23 모드 0 부피 감소](https://github.com/cataclysmbn/Cataclysm-BN/pull/10739)

MK 23 모드 0의 부피가 1607ml에서 1L로 줄었음

소음기를 단 채로 특대형 총집에 들어가고, 소음기를 빼면 일반 권총집에도 간신히 들어감

![MK 23 비교](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/4dcf12bb60d3853e31f531161cd1ec5cb20e14030bca171f24f17a7d913d7ce7.webp)

## [드론 로터 제작법을 책으로도 배움](https://github.com/cataclysmbn/Cataclysm-BN/pull/10751)

드론 로터 제작법을 고급 전기공학, 전자 회로 이론, 아마추어 비행사에서도 배울 수 있음

## [타코마 공동체 화장실과 온실에 지붕 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10746)

타코마 공동체의 화장실과 온실에 지붕이 생김

![타코마 공동체](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/75db7661d7ba58e3ed5b7c99dc4ef9d114592ec79dce3b7bcce9421d42543656.webp)

## [타코마 평상형 트럭 위치 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10777)

평상형 트럭이 맵 경계 밖으로 나가 게임이 튕기던 문제를 고침

## [올드 가드 대표가 자유상인연합 임무를 다시 주던 버그 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10732)

네크로폴리스 이후 올드 가드 대표가 태양광 발전, 김장의 날 임무를 다시 내주던 문제를 고침

## [진균체 벽도 연구소 게이트 벽으로 인식](https://github.com/cataclysmbn/Cataclysm-BN/pull/10731)

진균이 퍼진 연구소에서 게이트 레버가 작동하지 않던 문제를 고침

## [바이오닉 탐지기 전력 부족 메시지 반복 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10764)

전력이 떨어지면 메시지가 한 번만 나오고 꺼짐(이전에는 메시지가 계속 나오며 켜져 있었음)

![탐지기 메시지](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/b36c333cc0c155fbaf4ce573de655107e26e2d5c2905a8220fd86d13ee04750d.webp)

## [전투 체인톱·체인톱 월아산 수납 가능](https://github.com/cataclysmbn/Cataclysm-BN/pull/10762)

꺼진 전투 체인톱은 검 칼집에, 꺼진 체인톱 월아산은 파워 아머 무기 보관대에 수납할 수 있음

## [전술 풀 헬멧 타일 모양 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10741)

전술 풀 헬멧 스프라이트가 조금 작아지고 얼굴 앞이 막힌 모양으로 바뀜

![수정 전](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/8bd638e883106e8243b9b06c21cf57e544c50f94cd4e2978e430cb5519b041d8.webp)

![수정 후](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/d45c902f37fe45f6b9fc3da58874a7101f95cdd4e0735512b65fcf784a7f9e72.webp)

## [망치와 쇠지렛대에 ASCII 그림 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10782)

망치와 쇠지렛대의 물품 설명 카드에 ASCII 그림이 들어감

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/8c502f87a4d73b505cfd850674d156b2c952534901c1ac9f0b4c85ba42e9a74f.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@7e5b4eb0f6835581dd1e9d7333aa8b1711c01eea/23c5638ea5ce4dec848526aea2874027dc5dd1849ac6e593af98d51220740f76.webp)

## [SWAT cloaker 대사 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10736)

feral SWAT cloaker가 "We call this a difficulty tweak!"를 외칠 수 있음
