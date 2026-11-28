# 밝밤) 11월 22일 ~ 11월 28일 패치

## 11월 22일

### [적을 죽인 뒤에도 사격 모드 유지](https://github.com/cataclysmbn/Cataclysm-BN/pull/10972)

적을 쏴 죽여도 사거리 안에 다른 적이 남아 있으면 사격 모드가 풀리지 않음

전에는 반동이 방금 쏜 타일의 조준 한도를 넘으면 사격 모드가 그냥 끝났음. 이제는 반동은 안 보고 사거리 안에 적이 있는지만 확인함

- 예: 좀비 2마리 중 1마리를 쏴 죽이면 바로 남은 1마리를 조준함

### [게임 로딩 속도 향상: 타일셋 이미지 미리 읽기](https://github.com/cataclysmbn/Cataclysm-BN/pull/10922)

게임 데이터를 읽는 동안 타일셋 이미지를 다른 스레드에서 같이 풀어 둠

- 로딩 마무리 단계 3.42초 -> 2.36초 (31% 단축)
- 월드 로딩 전체 4.91초 -> 3.81초 (22% 단축)

### [실험판 DDA 타일셋에서 타일 방향이 틀어지던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10977)

DDA가 타일 회전 방식을 바꾼 뒤의 타일셋이 실험판에 들어가서 일부 타일이 엉뚱한 방향으로 돌아가 있었음. 이제 회전 방식이 바뀌기 전 버전을 넣음

## 11월 23일

### [진균 동물 5종 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10981)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/11124e3547da80cea30955ad71944f288bb7d543566a3d97264e0f59a1303594.webp)

고양이, 코요테, 늑대, 쿠거, 소의 진균 버전 추가

모두 마이커스 변이 캐릭터가 길들일 수 있음. 진균 소는 탈 수 있고, 과일을 먹인 뒤 젖을 짜면 버섯 맛 우유가 나옴

- 길들인 진균 동물이 야생 진균 괴물과 싸우지 않음
- 마이커스가 아닌 캐릭터가 키우던 동물이 진균에 감염되면 길들인 상태가 풀리고 적이 됨
- 예: 사람 캐릭터가 키우던 개가 진균 개가 되면 주인을 공격함

![진균 동물 스프라이트](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/18751baaa1c404ad8c60fd03998f0d36da9cca378a5f9c590f06b85eb4e88122.webp)

![진균 동물 스프라이트 2](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/63ad7456445a61989c8bfd0ef7c5d0d1fd62bfb71e8a5c922d1f865d610f6b16.webp)

![마이커스 펫과 야생 진균 괴물이 싸우지 않는 장면](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/6a0c73b7ad2707ca662b474e0c9a0f54b8e6333b542650e9ba216d656761e3f9.webp)

### [마약 거래, 죽은 생존자, 군대 특이한 지역 너프](https://github.com/cataclysmbn/Cataclysm-BN/pull/10993)

좋은 템이 너무 쉽게 나온다는 말이 많던 특이한 지역 3종에서 전리품이 줄고 위험한 스폰이 늘어남

이제 세 곳 모두 월드 설정의 아이템 생성 비율을 따름. 아이템 생성 비율을 낮춘 월드에서는 여기서 나오는 템도 같이 줄어듦

- 죽은 생존자: 시체에서 엘리트 생존자 전리품이 나올 확률 100% -> 30%, 나머지 70%는 일반 생존자 전리품. 강화 좀비 무리나 미고가 지키는 조우 등 2종 추가
- 군대: 군인 시체 수 2~6 -> 2~4. 좀비, 로봇 조우는 더 자주, 거의 안전하던 포탈 조우는 덜 나옴. 좀비 조우에 산탄총을 든 이성을 잃은 군인 추가
- 마약 거래: 시체에서 총이 나올 확률이 줄고, 나오면 대부분 권총임(기관단총, 산탄총은 드묾). 같이 나오는 탄약도 줄어듦
- 마약 거래: 시체 수는 줄고 적 스폰은 늘어남. 많이 진화한 좀비가 나오고, 낮은 확률로 SWAT 출신 이성을 잃은 인간 중간 보스도 나옴(총을 쓰는 종류는 안 나옴)

### [넓은 경작지가 딸린 농장 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10954)

농장이 DDA처럼 여러 조각을 이어 붙여 생성됨. 넓은 경작지가 딸린 큰 농장이 나올 수 있음

사과 과수원 지도 생성도 일부 바뀜

- 이전 세이브에 있던 농장 오버맵 지형 중 없어진 7종은 비슷한 지형으로 자동으로 바뀜. 이 처리가 들어가기 전에는 "Loaded invalid oter_id" 오류가 뜨고 해당 타일이 망가졌음
- 아직 생성되지 않은 출입구 있는 철조망 타일은 출입구 없는 철조망으로 바뀜

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/6dcb65c38e186951767709cd4784838e536e7dd095227c1b33366561a061754a.webp)

### [세이브 불러오기 약 2배 빨라짐](https://github.com/cataclysmbn/Cataclysm-BN/pull/10924)

![세이브를 불러와 지도가 뜰 때까지: 4.1초 -> 2.1초](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/75e6e3b5f38c1563dfb2290548509f48661808120160e474e4a0410436fd97d9.webp)

타일셋을 읽는 동안 지도 생성 데이터 준비를 다른 스레드에서 같이 함

세이브를 불러오는 과정에서 쓸데없이 하던 작업도 여러 개 뺌

- 세이브를 불러올 때 월드 원점 근처 지도를 더 이상 읽지 않음: 세이브 읽기 1.23초 -> 0.43초
- 로딩 화면을 항목 하나 읽을 때마다 다시 그리지 않고 최대 0.1초에 한 번만 그림: 월드 로딩 8.96초 -> 7.06초
- 다음 로딩 화면 이미지를 다른 스레드에서 미리 읽어 둠

### [침착한 NPC 옆에서 대기 속도 향상](https://github.com/cataclysmbn/Cataclysm-BN/pull/10986)

![NPC 8명이 보이는 곳에서 6시간 대기: 8.3초 -> 7.2초](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/577ad84af07ee2dd2c04c9226894f6ab0b78944f0615cab52bc6afe3aecfc8ee.webp)

대기 중에 침착한 NPC가 위험한지 매 턴 확인하지 않고 5턴마다 확인함. 최대 1.16배 빨라짐

대신 침착한 NPC가 위험을 몇 턴 늦게 알아챌 수 있음

### [냄새 차단 벽이 냄새를 제대로 막음](https://github.com/cataclysmbn/Cataclysm-BN/pull/10989)

플레이어가 있는 층의 냄새 차단(NO_SCENT) 벽이 냄새를 못 막았음. 다른 층까지 같이 보고 판정했기 때문인데, 이제 플레이어가 있는 층만 봄. 걸을 때 한 걸음 처리 시간도 약 21% 줄어듦

### [UDP 타일셋 오버맵에 생존자의 벙커, 트랜스-코스트 로지스틱스 타일 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/10994)

UDP 타일셋 오버맵에서 ASCII 글자로 나오던 생존자의 벙커와 트랜스-코스트 로지스틱스(TCL)가 이제 그림 타일로 나옴

### [화재감시탑에 진짜 깃대 설치](https://github.com/cataclysmbn/Cataclysm-BN/pull/10992)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/2f32453e7a058127b153031eb46abc4aa8b118a5d473adb8be3775f4037329df.webp)

화재감시탑에서 깃대 흉내를 내던 기둥이 진짜 깃대로 바뀜

## 11월 24일

### [하늘섬 두 번째 캐릭터가 허공에서 시작해 떨어지던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11017)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/37a1c92ac1115af725ecd6f5a382e7b3b163507cc023538551fb44b5c1caba04.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/7485ca68797f883af1cf100b0f88b054d2dcfacd8a71bba56ed2529001950d0c.webp)

게임을 끄지 않고 메인 메뉴에서 새 캐릭터를 만들면 지난 판에 있던 주머니 차원 안, 그것도 범위 밖에서 시작했음

이제 새 게임을 시작하거나 세이브를 불러올 때 항상 원래 세계로 돌아감. 하늘섬 모드 두 번째 캐릭터도 섬 위에서 시작함

### [오버맵 탐험 기록이 날아가던 세이브 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11007)

![바이오닉 전력이 -100 J인 NPC가 있는 세이브가 오류 없이 열림](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/47365e4303c86b67bdc721f38a97df0e16715050bcbf924753b18da194550b7f.webp)

오토닥으로 CBM:전력 저장소를 빼면 전력 용량이 두 번 빠져서 바이오닉 전력이 음수가 됐음. 이런 NPC가 있는 오버맵은 불러오지 못했고, 다음에 저장하면 탐험한 오버맵 기록이 덮어써져서 날아갔음

- CBM을 뺄 때 전력 용량을 한 번만 뺌 (예: 100 kJ CBM을 빼면 -100 J가 되던 문제)
- 저장된 바이오닉 전력이 음수면 0으로 불러옴
- 불러오다 실패한 오버맵은 저장하지 않음
- 이미 덮어써진 세이브는 복구 안 됨. 문제가 생기기 전 백업은 정상적으로 열림

### [대기 중 괴물이 나타나면 1턴 늦게 멈추던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11030)

대기 중에 괴물이나 NPC가 나타나면 대기가 1턴 늦게 끝났고, 그 턴에 적용돼야 할 시간당 효과(뮤타젠, 의욕 감소 등)도 빠졌음. 이제 제때 멈추고 효과도 그대로 적용됨

### [로딩 화면 이미지 4장 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/11000)

DDA에서 로딩 화면 이미지 4장을 가져옴

- 실험판 타일 버전을 받으면 로딩 화면 이미지가 같이 들어 있음

| 기본 게임 | 마이 스위트 카타클리즘 모드 |
| --- | --- |
| ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/538361f0211bd608d412858cc429dbcf5246520a3122cb688d9489238e38bc9d.webp) | ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/7a28464f86642c41c4ba9edc9a9e0bf431631eef2cba312d1145e7866ee86b9a.webp) |
| 어두운 미래의 저주 모드 | 숲속생활 모드 |
| ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/35f3e7decba0e92f7d103d38b9c1b257de7f41bd28517ade087ea0a18d0f3f30.webp) | ![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/74aab701ca9c43630894b88ab1a575c12b32d1c185bab1fb98b6e5d0b322d2a3.webp) |

### [본 적 있는 가스나 필드도 지도에 기억됨](https://github.com/cataclysmbn/Cataclysm-BN/pull/11025)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/af18c1f5e6d7f0c06f1e3a4295f80307c501cae546e700e8b41e9bdd6108a9fc.webp)

독성 가스 같은 필드가 시야 밖으로 나가도 지도에 계속 표시됨

발포 콘크리트처럼 벽 역할을 하는 필드도 멀리서 보이고, 독가스가 찬 방도 지도에 남음

### [GPS 장소 검색 약 9배 빨라짐](https://github.com/cataclysmbn/Cataclysm-BN/pull/11020)

GPS 검색으로 주택을 찾는 데 90초 걸리던 것이 10초로 줄어듦(디버그 GPS 기준)

### [액체가 정해진 탱크에 다른 액체를 넣으라고 뜨던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11026)

수도망에서 담을 액체가 정해진 탱크에 다른 액체가 선택지로 뜨던 문제를 고침. 예를 들어 수소 탱크에 깨끗한 물을 채우라고 뜨지 않음. 물탱크에는 깨끗한 물을 그대로 채울 수 있음

## 11월 25일

### [숲 동물 스폰 개편](https://github.com/cataclysmbn/Cataclysm-BN/pull/11032)

DDA의 숲 스폰 목록을 바탕으로 숲, 평야에서 나오는 동물 종류가 크게 늘어남

1일차부터 좀비 동물이 나와서 숲 동물을 다 죽이던 문제도 고침. 새 동물은 더 일찍 나오기 시작하고, 기존 동물은 시간이 지나도 더 천천히 줄어듦

- 현실성 문제로 DDA에서 빠졌던 늑대, 흡혈귀 박쥐 등이 다시 나옴
- 돌연변이 거대 개구리, 거대 메뚜기, 여러 새끼 새, 다양한 품종의 고양이와 개 등이 새로 나옴
- 기존 목록에 있던 동물은 그대로 나옴

### [FORCEFIELD, 초인적 회피(Uncanny Dodge) 인챈트 확률 오류 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11038)

두 인챈트가 DDA식 0~1 소수 확률로 계산돼서 인챈트만 있으면 총알을 사실상 다 피했음. 이제 0~100 정수 확률로 계산함

## 11월 26일

### [불 근처에서 대기 최대 10배 빨라짐](https://github.com/cataclysmbn/Cataclysm-BN/pull/11049)

![땔감을 계속 넣는 벽난로 옆에서 12시간 대기: 34.5초 -> 7.5초](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/f8a4889d27f08704e722a11cbd1730a04b519a0cb9d9628e1d88d0a95063a07e.webp)

근처에 불이 타고 있으면 대기나 제작을 한 턴씩 처리해서 느렸음. 땔감 타일에서 땔감을 계속 받는 벽난로 옆이 특히 심했음. 이제 불이 있어도 5분 단위로 묶어서 처리함

- 벽난로 옆: 10.06배 빨라짐
- 번지는 불 근처: 14.79배 빨라짐
- 불이 있는 구역과 불이 번지는 옆 구역은 계속 턴마다 처리해서 불 번짐은 그대로임

![번지는 불 근처에서 2시간 대기: 4.6초 -> 1.0초](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/4fa198fc2232febee540ed7751efaae30429e2fcdfe28cee852cdabcb8a389f7.webp)

### [차량 작업 속도 월드 옵션 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/11022)

건설 속도 백분율처럼 차량 작업 속도를 따로 정하는 월드 옵션(Vehicle work speed percentage) 추가

0~1000% 사이로 정할 수 있고 기본값은 100%, 0%면 작업이 바로 끝남

- 차량 부품 설치, 제거, 수리, 부서진 부품 교체에 적용됨
- 차량 메뉴의 예상 작업 시간에도 반영됨
- 차량 자동 수리 구역, 해체 구역 작업에도 적용됨

### [알비노와 다른 피부색을 번갈아 고르면 특성 포인트가 쌓이던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11004)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/ae049d5ec925dca688f7a741ce90fd3f39bb9e21c7a37abcef1077411d36987d.webp)

캐릭터 생성에서 알비노를 골랐다가 다른 피부색으로 바꿔도 알비노로 얻은 포인트가 회수되지 않았음

- 전: 바꿀 때마다 특성 포인트 +1, 단점 합계 +1씩 쌓임
- 후: 알비노를 골랐다가 피부색: 분홍으로 바꾸면 포인트 9 -> 8, 단점 -1/-12 -> 0/-12로 원래대로 돌아옴
- 바꾼 결과 단점이 12점을 넘으면 "Sorry, but you can only take 12 points of disadvantages." 메시지가 뜨고 원래 피부색이 유지됨

### [작은 불이 용암 열기를 가리던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11039)

열 복사를 타일마다 불의 세기와 지형 열기 중 더 뜨거운 쪽으로 계산함. 용암 위에 작은 불이 붙어도 용암 열기가 그대로 들어옴

### [폐기장, 지역 쓰레기장 오버맵 모양 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11042)

오버맵에서 도시 건물처럼 나오던 폐기장이 다른 폐기장 타일과 같은 모양으로 나옴. 한 가지 타일로만 채워져 있던 지역 쓰레기장은 주차장이 있는 모서리 2칸이 주차장 모양으로 나옴

## 11월 27일

### [건설 도중 저장한 세이브를 불러오면 튕기던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11056)

건설하는 도중에 저장한 세이브를 불러오면 메모리 접근 오류로 튕기던 문제를 고침

### [UPS로 배터리 도구 충전 오류 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11041)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/b8eedf263e52208d7ba1bc7ac805528d74cd3122f3d67b931843ed9327a3e967.webp)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/3911da5c1e308aa15ba2522a188df26d3ea23f95311e4df16825e4157ad4b596.webp)

모드가 켠 바이오닉 탐지기처럼 탄약 종류 없이 정의한 도구를 UPS로 충전하면 "Tried to set invalid ammo battery" 오류 창이 떴음. 이제 도구 안에 든 배터리를 바로 충전함

### [눈먼 상태로 부딪혀 기억한 타일이 제 방향으로 보임](https://github.com/cataclysmbn/Cataclysm-BN/pull/11054)

![](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/c08db10e6ae6fc1db6892649a996b83dda71f2fce26a1d72b918441fa657e3ce.webp)

눈먼 캐릭터가 벽이나 가구에 부딪혀 기억한 타일이 이제 실제 방향대로 지도에 그려짐

### [화면 배율 2x/4x에서 로딩 화면 이미지가 안 보이던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/10646)

SDL3로 바뀐 뒤 화면 배율이 2x, 4x면 로딩 화면 이미지와 출처 글이 아예 안 나왔음. 이제 제대로 나오고, 이미지를 부드럽게 확대해서 덜 깨져 보임

## 11월 28일

### [시작 특성 4종 추가](https://github.com/cataclysmbn/Cataclysm-BN/pull/11061)

튼튼함(Durable), 격파불가(Unbreakable), 고통에 약함(Hyperalgesia), 고통에 매우 약함(Extreme Hyperalgesia)을 캐릭터 생성 때 고를 수 있음

### [Flatpak 버전에서 월드 시작하자마자 튕기던 문제 수정](https://github.com/cataclysmbn/Cataclysm-BN/pull/11064)

기본 지역 설정에서 아파트 분포 값이 0이라 Flatpak 버전은 월드를 시작하자마자 튕겼음. 이제 정상적으로 시작됨. 지역 설정을 덮어쓸 때 아파트 값이 상점 값까지 덮어쓰던 문제도 같이 고침

### [대기 속도 최대 1.2배 향상](https://github.com/cataclysmbn/Cataclysm-BN/pull/11057)

![불이 없는 곳에서 12시간 대기, 왼쪽 전, 오른쪽 후](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/ab8ad1162f3e41a5f6af0c9ccb23a33b6087766496d5035e09460826ed9b6a00.webp)

근처에 불이나 함정이 없으면 대기 중에 불에 땔감 넣을 곳 찾기와 숨은 함정 찾기를 매 턴 하지 않음

- 평야에서 10시간 대기: 1.24배 빨라짐
- 마을 1.15배, 벽난로 옆 1.10배, 건초 불 옆 1.23배 빨라짐
- 허공, 구덩이처럼 지형에 딸린 함정도 함정 목록에 들어가서, 함정 찾기를 건너뛰어도 이런 함정은 놓치지 않음

![벽난로 옆에서 12시간 대기, 왼쪽 전, 오른쪽 후](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/150d9398b0662d0552bd68d290139fe84e61cb47d2bd6f96083698ce79c1dd9a.webp)

![건초 불 옆에서 12시간 대기, 왼쪽 전, 오른쪽 후](https://cdn.jsdelivr.net/gh/cataclysmbn/changelog@b81f66b9ab788aac7b973a2e5b764bcfa18ff6e1/b1fe4badce1461afdd2a353aab627daf1f074d2e1f09c780d5ba1f7a628ec3e8.webp)

---

이 변경 내역은 AI(claude-opus-5-5)로 자동 생성되었습니다.
