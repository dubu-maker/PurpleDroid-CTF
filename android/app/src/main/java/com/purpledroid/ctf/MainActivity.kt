package com.purpledroid.ctf

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import retrofit2.Response

// --- 웹 API 스펙에 맞춘 데이터 모델 ---
data class ApiResponse<T>(val ok: Boolean, val data: T?, val error: Any?)
data class SessionData(val sessionToken: String)
data class ChallengeList(val challenges: List<ChallengeSummary>)
data class ChallengeSummary(val id: String, val title: String, val summary: String, val status: Map<String, String>)
data class SubmitRequest(val flag: String)
data class SubmitResponse(val correct: Boolean, val message: String)

// 2-2 배송 요청을 위한 데이터 모델
data class OrderRequestPayload(val orderId: String, val tier: String)

// --- Retrofit API 정의 ---
interface ApiService {
    @POST("api/v1/session")
    suspend fun createSession(): ApiResponse<SessionData>

    @GET("api/v1/challenges")
    suspend fun getChallenges(@Header("Authorization") token: String): ApiResponse<ChallengeList>

    @POST("api/v1/challenges/{challengeId}/submit-flag")
    suspend fun submitFlag(
        @Header("Authorization") token: String,
        @Path("challengeId") challengeId: String,
        @Body request: SubmitRequest
    ): ApiResponse<SubmitResponse>

    // 2-1 배송 조회 전용 API (헤더를 읽기 위해 Response 객체로 감쌈)
    @POST("api/v1/challenges/level2_1/actions/track")
    suspend fun trackParcel(): Response<Map<String, Any>>

    // 2-2 일반 배송 요청 API
    @POST("api/v1/challenges/level2_2/actions/order")
    suspend fun orderParcel(@Body request: OrderRequestPayload): Response<Map<String, Any>>
}

class MainActivity : ComponentActivity() {
    private val retrofit = Retrofit.Builder()
        .baseUrl("http://localhost:8000/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val apiService = retrofit.create(ApiService::class.java)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { PurpleDroidApp(apiService) }
    }
}

@Composable
fun PurpleDroidApp(apiService: ApiService) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // 상태 관리
    var sessionToken by remember { mutableStateOf<String?>(null) }
    var challenges by remember { mutableStateOf<List<ChallengeSummary>>(emptyList()) }
    var currentChallengeId by remember { mutableStateOf<String?>(null) }
    var inputFlag by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    var resultMessage by remember { mutableStateOf<String?>(null) }
    var isSolvedCurrent by remember { mutableStateOf(false) }

    // 앱 시작 시 세션 생성 및 챌린지 목록 로드
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                isLoading = true
                val sessionRes = apiService.createSession()
                if (sessionRes.ok && sessionRes.data != null) {
                    sessionToken = "Bearer ${sessionRes.data.sessionToken}"
                    val listRes = apiService.getChallenges(sessionToken!!)
                    if (listRes.ok && listRes.data != null) {
                        challenges = listRes.data.challenges
                        if (challenges.isNotEmpty()) currentChallengeId = challenges[0].id
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Connection Error", Toast.LENGTH_LONG).show()
            } finally {
                isLoading = false
            }
        }
    }

    // 탭이 바뀌면 입력창과 결과 메시지 초기화 및 로그 생성
    LaunchedEffect(currentChallengeId) {
        inputFlag = ""
        resultMessage = null
        isSolvedCurrent = false

        when (currentChallengeId) {
            "level1" -> Log.d("PurpleDroid_Basic", "Flag is: FLAG{Always_Check_The_Logs_First}")
            "level1_2" -> {
                scope.launch {
                    Log.i("SystemTrace", "Starting authentication process...")
                    for (i in 1..10) {
                        val fakeHash = java.util.UUID.randomUUID().toString().substring(0, 8)
                        Log.d("SystemTrace", "Login failed: invalid credentials. token=FLAG{Fk_${fakeHash}_ab39}")
                        kotlinx.coroutines.delay(10)
                    }
                    kotlinx.coroutines.delay(500)
                    Log.i("SystemTrace", "Login success! Session established. token=FLAG{DEV_ONLY_LEVEL1_2}")
                    kotlinx.coroutines.delay(100)
                    for (i in 11..20) {
                        val fakeHash = java.util.UUID.randomUUID().toString().substring(0, 8)
                        Log.d("SystemTrace", "Login failed: token expired. token=FLAG{Ex_${fakeHash}_c9f2}")
                        kotlinx.coroutines.delay(10)
                    }
                }
            }
            "level1_3" -> {
                scope.launch {
                    Log.d("SystemTrace", "[CryptoProvider] init_vector = DEV_O")
                    kotlinx.coroutines.delay(100)
                    Log.d("SystemTrace", "[NetworkSync] payload_tail = L1_3")
                    kotlinx.coroutines.delay(100)
                    Log.d("SystemTrace", "[SessionManager] auth_block = NLY_LEVE")
                    kotlinx.coroutines.delay(200)
                    Log.w("SystemTrace", "[SystemAudit] WARN: Raw tokens must be wrapped in FLAG{...}")
                }
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("🛡️ PurpleDroid CTF", style = MaterialTheme.typography.headlineMedium)

        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.padding(16.dp))
            return@Column
        }

        Spacer(modifier = Modifier.height(16.dp))

        // --- 상단 탭 (미션 선택) ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            challenges.forEach { challenge ->
                val isSelected = currentChallengeId == challenge.id
                val isSolved = challenge.status["attack"] == "solved"

                Button(
                    onClick = { currentChallengeId = challenge.id },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primary else Color.Gray
                    ),
                    modifier = Modifier.padding(2.dp).weight(1f),
                    contentPadding = PaddingValues(2.dp)
                ) {
                    val label = challenge.id.replace("level", "").replace("_", "-")
                    Text(text = "$label${if(isSolved) "✅" else ""}", fontSize = 11.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // --- 현재 미션 UI ---
        val currentChallenge = challenges.find { it.id == currentChallengeId }

        if (currentChallenge != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = currentChallenge.title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.Black)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = currentChallenge.summary, color = Color.DarkGray)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 다이나믹 힌트
            val hintCommand = when (currentChallengeId) {
                "level1" -> "adb logcat -d | findstr \"PurpleDroid_\""
                "level1_2" -> "adb logcat -d | findstr \"SystemTrace\""
                "level1_3" -> "adb logcat -d | findstr \"SystemTrace\""
                "level2_1" -> "adb logcat -d | findstr \"NetworkSniffer\""
                "level2_2" -> "curl -X POST http://localhost:8000/api/v1/challenges/level2_2/actions/order --data '{\"orderId\":\"A102\", \"tier\":\"standard\"}'"
                else -> "adb logcat -d"
            }
            HintCard(context, "Logcat Command / Terminal", hintCommand)

            Spacer(modifier = Modifier.height(16.dp))

            // 2-1 전용 배송 조회 버튼 UI (핑크색)
            if (currentChallengeId == "level2_1") {
                Button(
                    onClick = {
                        scope.launch {
                            try {
                                val response = apiService.trackParcel()
                                Toast.makeText(context, "배송 조회 완료! (화면엔 정상 데이터만 보입니다)", Toast.LENGTH_SHORT).show()

                                Log.i("NetworkSniffer", "--- INTERCEPTED HTTP RESPONSE ---")
                                Log.i("NetworkSniffer", "HTTP/1.1 ${response.code()}")
                                val headers = response.headers()
                                for (i in 0 until headers.size()) {
                                    Log.d("NetworkSniffer", "${headers.name(i)}: ${headers.value(i)}")
                                }
                                Log.i("NetworkSniffer", "Body: ${response.body()}")
                                Log.i("NetworkSniffer", "-----------------------------------")
                            } catch (e: Exception) {
                                Toast.makeText(context, "통신 에러: 서버 상태 확인 필요", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63))
                ) {
                    Text("📦 배송 조회 (Track Parcel)", color = Color.White)
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 2-2 전용 일반 배송 요청 버튼 UI (파란색)
            if (currentChallengeId == "level2_2") {
                Button(
                    onClick = {
                        scope.launch {
                            try {
                                val response = apiService.orderParcel(OrderRequestPayload("A102", "standard"))
                                Toast.makeText(context, "일반 배송(standard) 요청 완료!", Toast.LENGTH_SHORT).show()

                                Log.i("NetworkSniffer", "--- INTERCEPTED HTTP REQUEST & RESPONSE ---")
                                Log.i("NetworkSniffer", "Request Body: {\"orderId\":\"A102\", \"tier\":\"standard\"}")
                                Log.i("NetworkSniffer", "HTTP/1.1 ${response.code()}")
                                val headers = response.headers()
                                for (i in 0 until headers.size()) {
                                    Log.d("NetworkSniffer", "${headers.name(i)}: ${headers.value(i)}")
                                }
                                Log.i("NetworkSniffer", "Response Body: ${response.body()}")
                                Log.i("NetworkSniffer", "-------------------------------------------")
                            } catch (e: Exception) {
                                Toast.makeText(context, "통신 에러", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF03A9F4))
                ) {
                    Text("🚚 일반 배송 요청 (Standard)", color = Color.White)
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 정답 입력창
            OutlinedTextField(
                value = inputFlag,
                onValueChange = { inputFlag = it },
                label = { Text("Enter Flag") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 결과 메시지
            if (resultMessage != null) {
                Text(
                    text = resultMessage!!,
                    color = if (isSolvedCurrent) Color(0xFF4CAF50) else Color.Red,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 제출 / Next Level 버튼
            if (!isSolvedCurrent) {
                Button(
                    onClick = {
                        if (sessionToken == null) return@Button
                        scope.launch {
                            try {
                                val res = apiService.submitFlag(sessionToken!!, currentChallengeId!!, SubmitRequest(inputFlag))
                                if (res.ok && res.data?.correct == true) {
                                    isSolvedCurrent = true
                                    resultMessage = "Correct! Level Cleared 🎉"
                                    val listRes = apiService.getChallenges(sessionToken!!)
                                    if (listRes.ok && listRes.data != null) challenges = listRes.data.challenges
                                } else {
                                    isSolvedCurrent = false
                                    resultMessage = "Wrong Flag ❌ Try Again."
                                }
                            } catch (e: Exception) {
                                resultMessage = "Error: ${e.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF673AB7))
                ) {
                    Text("Submit Flag")
                }
            } else {
                val currentIndex = challenges.indexOfFirst { it.id == currentChallengeId }
                val nextChallenge = challenges.getOrNull(currentIndex + 1)

                LectureNoteCard(challengeId = currentChallengeId!!)

                if (nextChallenge != null) {
                    Button(
                        onClick = { currentChallengeId = nextChallenge.id },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF009688))
                    ) {
                        Text("Next Level ➡️")
                    }
                } else {
                    Text("All Challenges Cleared! 🏆", color = Color.Blue, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// HintCard
@Composable
fun HintCard(context: Context, title: String, command: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(8.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = "[$title]", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                Text(text = command, fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = Color.Black)
            }
            IconButton(onClick = {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Hint Command", command)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(context, "복사됨! 📋", Toast.LENGTH_SHORT).show()
            }) {
                Icon(Icons.Filled.ContentCopy, contentDescription = "Copy", tint = Color.Gray)
            }
        }
    }
}

// 강의 노트 카드
@Composable
fun LectureNoteCard(challengeId: String) {
    val (title, content) = when (challengeId) {
        "level1" -> "📝 [강의 노트] 로그 유출 (Logcat Leak)" to """
            해커들이 앱을 분석할 때 가장 먼저 확인하는 곳이 바로 로그(Log)야.
            
            🚨 현실의 취약점 사례:
            개발 과정에서 디버깅을 편하게 하려고 로그인 토큰, API 키, 심지어 사용자의 비밀번호나 개인정보(주민번호 등)를 Log.d()로 출력해두고, 출시(Release)할 때 깜빡하고 지우지 않는 경우가 엄청나게 많아. 
            실제로 과거 유명 SNS나 금융 앱에서도 사용자 세션 토큰이 내부 로그에 평문으로 찍히는 버그가 발견된 적이 있어. 악성 앱이 로그 접근 권한을 얻거나, 누군가 USB를 꽂아 ADB로 폰을 연결하면 이 정보는 그대로 털리게 돼.
            
            🛡️ 어떻게 방어해야 할까?
            1. 출시 빌드(Release)에서는 로그가 아예 찍히지 않도록 ProGuard/R8 규칙을 설정해서 Log 클래스 호출을 통째로 날려버려야 해.
            2. 실무에서는 Timber 같은 로깅 라이브러리를 써서, Debug 모드에서만 로그가 작동하게 만드는 것이 기본이야! 절대 "이 정도는 안 들키겠지" 하고 민감한 정보를 남기지 마.
        """.trimIndent()

        "level1_2" -> "📝 [강의 노트] 쓰레기 데이터 섞기 (Security by Obscurity)" to """
            가짜 데이터(Decoy)를 잔뜩 뿌려서 진짜를 숨기려는 시도였어.
            
            🚨 현실의 취약점 사례:
            초보 개발자들이 종종 "암호화를 하긴 힘드니까, 알아보기 힘들게 꼬아놔야지"라고 생각하며 이 방식을 써. 하지만 해커들은 바보가 아니야! 그들은 눈으로 직접 찾는 게 아니라 정규표현식(Regex)이나 자동화된 스크립트(grep, awk)를 사용해서 단숨에 패턴을 분석해버려.
            이렇게 가짜 데이터 속에 진짜 데이터를 숨기는 걸 '숨김에 의한 보안(Security by Obscurity)'이라고 부르는데, 이건 진짜 보안이 아니야. 패턴만 파악되면 1초 만에 뚫려버리거든.
            
            🛡️ 어떻게 방어해야 할까?
            로그의 태그를 바꾸거나 가짜 데이터를 넣는 꼼수를 쓰지 말고, 애초에 민감한 정보 자체를 메모리나 로그에 평문으로 올리지 않는 게 유일한 정답이야. 인증은 결과(성공/실패)만 기록하고, 토큰 값은 절대 기록해선 안 돼.
        """.trimIndent()

        "level1_3" -> "📝 [강의 노트] 데이터 쪼개기 (Split & Stitch)" to """
            중요한 토큰을 세 조각으로 나눠서 로그에 뿌려놓은 미션이었어.
            
            🚨 현실의 취약점 사례:
            악성코드 제작자들이나, API 키를 앱에 숨기고 싶은 개발자들이 아주 자주 쓰는 방법이야. 문자열을 한 번에 하드코딩하면 너무 쉽게 들키니까 "KeyPart1", "KeyPart2" 이런 식으로 변수를 쪼개놓거나 순서를 섞어두지.
            하지만 앱이 실행되는 흐름(메모리나 로그)을 추적하면 결국 조각난 데이터들은 어딘가에서 하나로 합쳐질 수밖에 없어. 해커들은 실행 흐름을 따라가며 조각을 다시 이어 붙이는(Stitch) 리버싱 기술에 아주 능숙해.
            
            🛡️ 어떻게 방어해야 할까?
            데이터를 쪼개는 건 해커의 시간을 단 5분 정도 늦출 뿐이야. 진짜 중요한 정보(토큰, 키)는 안드로이드의 하드웨어 지원 암호화 저장소인 Keystore 시스템을 사용하거나, EncryptedSharedPreferences를 통해 제대로 '암호화'해서 보관하는 것만이 유일한 해결책이야.
        """.trimIndent()

        "level2_1" -> "📝 [강의 노트] 보이지 않는 데이터 (Invisible Header)" to """
            화면(UI)에 보이지 않는다고 해서 데이터가 없는 것이 아닙니다!
            
            🚨 현실의 취약점 사례:
            개발자들이 API를 설계할 때, "어차피 앱 화면에는 Body 값만 그려주니까, Header에 민감한 디버그 정보나 내부 관리자용 플래그를 넣어도 유저들은 모르겠지?"라고 착각하는 경우가 많습니다. 
            하지만 해커들은 프록시 툴(Burp Suite, Charles 등)을 사용해 서버와 주고받는 모든 패킷(Header 포함)을 낱낱이 들여다봅니다.
            
            🛡️ 어떻게 방어해야 할까?
            클라이언트(앱/웹)로 전달되는 모든 데이터는 이미 유저의 손에 넘어간 것입니다. UI에서 숨긴다고 안전해지지 않습니다. 클라이언트에는 '반드시 필요한 최소한의 데이터'만 전송해야 합니다.
        """.trimIndent()

        "level2_2" -> "📝 [강의 노트] 데이터 변조 (Parameter Tampering)" to """
            클라이언트가 보내는 데이터를 절대 신뢰하지 마세요!
            
            🚨 현실의 취약점 사례:
            쇼핑몰에서 결제 금액을 클라이언트에서 서버로 보낼 때, 해커가 프록시 툴을 이용해 가격을 '10원'으로 변조해서 보내는 고전적인 해킹 기법입니다. 또는 회원가입 시 'role: user'를 'role: admin'으로 변조하여 관리자 권한을 탈취하기도 합니다.
            
            🛡️ 어떻게 방어해야 할까?
            보안의 제1원칙: "클라이언트에서 넘어오는 모든 입력값은 조작되었다고 가정하라."
            가격, 권한(tier) 같은 중요한 결정은 절대 클라이언트에서 보낸 값을 그대로 믿으면 안 됩니다. 서버 측에서 세션을 기준으로 DB를 다시 조회하여 권한을 검증(Validation)해야 합니다.
        """.trimIndent()

        else -> "📝 강의 노트" to "이 미션에 대한 훌륭한 해커가 되기 위한 팁이 준비 중입니다!"
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD)), // 연한 파란색(강의 노트 느낌)
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1565C0))
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = content, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 22.sp)
        }
    }
}