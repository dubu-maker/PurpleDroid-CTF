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
import androidx.compose.material.icons.filled.Refresh
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

// --- 웹 API 스펙에 맞춘 데이터 모델 ---
data class ApiResponse<T>(val ok: Boolean, val data: T?, val error: Any?)
data class SessionData(val sessionToken: String)
data class ChallengeList(val challenges: List<ChallengeSummary>)
data class ChallengeSummary(val id: String, val title: String, val summary: String, val status: Map<String, String>) // status: {attack: "available", ...}
data class SubmitRequest(val flag: String)
data class SubmitResponse(val correct: Boolean, val message: String)

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
}

class MainActivity : ComponentActivity() {
    // 에뮬레이터: 10.0.2.2, 실기기: localhost (adb reverse 필요)
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

    // ✨ 추가된 상태: 결과 메시지 & 정답 여부
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

    // 탭이 바뀌면 입력창과 결과 메시지 초기화
    LaunchedEffect(currentChallengeId) {
        inputFlag = ""
        resultMessage = null
        isSolvedCurrent = false // 탭 이동 시 일단 초기화 (이미 푼 문제인지 체크는 아래 challenges에서 확인 가능)

        // 미션별 로그 생성 (기존 로직 유지)
        when (currentChallengeId) {
            "level1" -> Log.d("PurpleDroid_Basic", "Flag is: FLAG{Always_Check_The_Logs_First}")
            "level1_2" -> { // 1-2 Decoy (Hard Mode)
                Log.i("AuthService", "Starting authentication process...")
                // 가짜 1~20 (로그인 실패)
                for (i in 1..20) {
                    val fakeHash = java.util.UUID.randomUUID().toString().substring(0, 8)
                    Log.d("AuthService", "Login failed: invalid credentials. token=FLAG{Fk_${fakeHash}_ab39}")
                }

                // ⭐ 진짜 정답 (로그인 성공!)
                Log.i("AuthService", "Login success! Session established. token=FLAG{DEV_ONLY_LEVEL1_2}")

                // 가짜 21~40 (토큰 만료)
                for (i in 21..40) {
                    val fakeHash = java.util.UUID.randomUUID().toString().substring(0, 8)
                    Log.d("AuthService", "Login failed: token expired. token=FLAG{Ex_${fakeHash}_c9f2}")
                }
            }
            "level1_3" -> { // 1-3 Split (Hard Mode)
                // 진짜 정답: FLAG{DEV_ONLY_LEVEL1_3}
                // 조각: DEV_O / NLY_LEVE / L1_3

                // 순서를 1, 2, 3이 아닌 단어로 힌트 주기 (머리, 몸통, 꼬리 느낌)
                // 출력 순서도 섞어버림 (init -> tail -> body 순서로 찍힘)F
                Log.d("CryptoProvider", "init_vector = DEV_O")
                Log.d("NetworkSync", "payload_tail = L1_3")
                Log.d("SessionManager", "auth_block = NLY_LEVE")

                // 힌트 로그 하나 남겨주기 (FLAG{}로 감싸야 한다는 걸 알려줌)
                Log.w("SystemAudit", "WARN: Raw tokens must be wrapped in FLAG{...} before submission.")
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
                    modifier = Modifier.padding(4.dp).weight(1f)
                ) {
                    val label = challenge.id.replace("level", "").replace("_", "-")
                    Text(text = "$label${if(isSolved) "✅" else ""}", fontSize = 12.sp)
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

            // 현재 레벨에 맞춰서 힌트 명령어를 다르게 설정!
            val hintCommand = when (currentChallengeId) {
                "level1" -> "adb logcat -d | findstr \"PurpleDroid_\""
                "level1_2" -> "adb logcat -d | findstr \"AuthService\""
                "level1_3" -> "adb logcat -d" // 1-3은 태그가 여러 개니까 전체 로그를 보거나 grep으로 직접 찾게 유도
                else -> "adb logcat -d"
            }
            HintCard(context, "Logcat Command", hintCommand)

            Spacer(modifier = Modifier.height(16.dp))

            // 정답 입력창
            OutlinedTextField(
                value = inputFlag,
                onValueChange = { inputFlag = it },
                label = { Text("Enter Flag") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // ✨ 결과 메시지 (Toast 대신 여기에 계속 표시)
            if (resultMessage != null) {
                Text(
                    text = resultMessage!!,
                    color = if (isSolvedCurrent) Color(0xFF4CAF50) else Color.Red, // 성공: 초록, 실패: 빨강
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 제출 버튼
            if (!isSolvedCurrent) {
                Button(
                    onClick = {
                        if (sessionToken == null) return@Button
                        scope.launch {
                            try {
                                val res = apiService.submitFlag(sessionToken!!, currentChallengeId!!, SubmitRequest(inputFlag))
                                if (res.ok && res.data?.correct == true) {
                                    // 정답!
                                    isSolvedCurrent = true
                                    resultMessage = "Correct! Level Cleared 🎉"

                                    // 목록 새로고침 (체크 표시 업데이트용)
                                    val listRes = apiService.getChallenges(sessionToken!!)
                                    if (listRes.ok && listRes.data != null) challenges = listRes.data.challenges
                                } else {
                                    // 오답
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
                // ✨ 정답 맞히면 '다음 레벨' 버튼 등장!
                val currentIndex = challenges.indexOfFirst { it.id == currentChallengeId }
                val nextChallenge = challenges.getOrNull(currentIndex + 1)

                if (nextChallenge != null) {
                    Button(
                        onClick = { currentChallengeId = nextChallenge.id }, // 다음 탭으로 이동
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF009688)) // 청록색
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

// HintCard는 기존과 동일
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