package com.purpledroid.ctf

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
// ★ 아이콘 임포트 수정 (Default -> Filled)
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
import retrofit2.http.Body
import retrofit2.http.POST

// --- 네트워크 데이터 모델 ---
data class FlagRequest(val level: Int, val flag: String)
data class ServerResponse(val status: String?, val message: String?, val detail: String?)

interface ApiService {
    @POST("verify")
    suspend fun verifyFlag(@Body request: FlagRequest): ServerResponse
}

// --- 메인 액티비티 ---
class MainActivity : ComponentActivity() {

    // ★ 에러 해결: Retrofit 변수를 클래스 내부로 이동 (안전함)
    private val retrofit = Retrofit.Builder()
        .baseUrl("http://localhost:8000/") // 에뮬레이터: 10.0.2.2
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val apiService = retrofit.create(ApiService::class.java)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            // apiService를 앱에 전달
            PurpleDroidApp(apiService)
        }
    }
}

@Composable
fun PurpleDroidApp(apiService: ApiService) { // apiService를 인자로 받음
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var inputFlag by remember { mutableStateOf("") }
    var isLevelCleared by remember { mutableStateOf(false) }
    var isDefenseCleared by remember { mutableStateOf(false) }
    var showHint by remember { mutableStateOf(false) }

    // [취약점] 로그 남기기
    LaunchedEffect(Unit) {
        Log.d("PurpleDroid_Secret", "Debug: Server_Key = FLAG{Always_Check_The_Logs_First}")
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("🛡️ Level 1: Logcat Leak", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(8.dp))

        // 탭 버튼 (Attack / Defense)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            Button(
                onClick = { /* Attack Mode */ },
                colors = ButtonDefaults.buttonColors(containerColor = if(!isLevelCleared) MaterialTheme.colorScheme.primary else Color.Gray)
            ) { Text("1. Attack (Red)") }

            Button(
                onClick = {
                    if (!isLevelCleared) Toast.makeText(context, "공격부터 성공하세요!", Toast.LENGTH_SHORT).show()
                },
                colors = ButtonDefaults.buttonColors(containerColor = if(isLevelCleared) Color(0xFF4CAF50) else Color.LightGray)
            ) { Text("2. Defense (Blue)") }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (!isLevelCleared) {
            // ==========================
            // 🔴 ATTACK MODE
            // ==========================
            Text("미션: 로그캣(Logcat)에 숨겨진 Flag를 찾으세요.")
            Spacer(modifier = Modifier.height(16.dp))

            // 힌트 버튼
            OutlinedButton(onClick = { showHint = !showHint }) {
                Text(if (showHint) "Hide Hint" else "Need a Hint? 💡")
            }

            // 힌트 카드
            if (showHint) {
                Spacer(modifier = Modifier.height(8.dp))
                HintCard(context, "Windows", "adb logcat -d | findstr \"PurpleDroid\"")
                Spacer(modifier = Modifier.height(4.dp))
                HintCard(context, "Mac / Linux", "adb logcat -d | grep \"PurpleDroid\"")
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = inputFlag,
                onValueChange = { inputFlag = it },
                label = { Text("Enter Flag") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    scope.launch {
                        try {
                            val response = apiService.verifyFlag(FlagRequest(1, inputFlag))
                            Toast.makeText(context, response.message, Toast.LENGTH_LONG).show()
                            isLevelCleared = true
                        } catch (e: Exception) {
                            Toast.makeText(context, "틀렸습니다! (문장 전체를 입력하세요)", Toast.LENGTH_SHORT).show()
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Submit Flag") }

        } else {
            // ==========================
            // 🔵 DEFENSE MODE
            // ==========================
            Text("✅ 공격 성공! 이제 코드를 수정하세요.", fontWeight = FontWeight.Bold, color = Color(0xFF4CAF50))
            Spacer(modifier = Modifier.height(8.dp))
            Text("정보 유출을 일으키는 라인을 찾아 터치하여 삭제하세요.", fontSize = 14.sp)

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF2B2B2B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    CodeLine("fun onCreate() {", false) {}
                    CodeLine("    super.onCreate()", false) {}
                    CodeLine("    initUI()", false) {}

                    if (!isDefenseCleared) {
                        // ★ 정답 라인 (흰색으로 숨김)
                        CodeLine("    Log.d(\"Secret\", \"Key = FLAG{...}\")", true) {
                            isDefenseCleared = true
                            Toast.makeText(context, "Patch Applied! Security Hole Fixed. 🛡️", Toast.LENGTH_LONG).show()
                        }
                    } else {
                        // 패치된 모습
                        Text(
                            text = "    // Log.d(\"Secret\", \"Key = ...\") [PATCHED]",
                            color = Color.Gray,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                    CodeLine("}", false) {}
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (isDefenseCleared) {
                Button(
                    onClick = { Toast.makeText(context, "Level 2 Coming Soon!", Toast.LENGTH_SHORT).show() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF673AB7))
                ) { Text("Next Level ➡️") }
            }
        }
    }
}

// 힌트 카드 (복사 버튼 정상 작동)
@Composable
fun HintCard(context: Context, osName: String, command: String) {
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
                Text(text = "[$osName]", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                Text(text = command, fontFamily = FontFamily.Monospace, fontSize = 13.sp)
            }
            IconButton(onClick = {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Hint Command", command)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(context, "명령어 복사됨! 📋", Toast.LENGTH_SHORT).show()
            }) {
                // ★ 여기 Icons.Filled.ContentCopy 사용
                Icon(Icons.Filled.ContentCopy, contentDescription = "Copy", tint = Color.Gray)
            }
        }
    }
}

// MainActivity.kt 파일 하단 CodeLine 함수 수정

@Composable
fun CodeLine(code: String, isVulnerable: Boolean, onCorrect: () -> Unit) {
    val context = LocalContext.current // 토스트를 띄우기 위해 Context 필요

    Text(
        text = code,
        color = Color.White,
        fontFamily = FontFamily.Monospace,
        fontSize = 14.sp,
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                if (isVulnerable) {
                    // 정답! -> 전달받은 성공 로직 실행
                    onCorrect()
                } else {
                    // 오답! -> 토스트 메시지 띄우기 ❌
                    Toast.makeText(context, "🚫 이 코드는 안전하거나 필수적인 코드입니다.", Toast.LENGTH_SHORT).show()
                }
            }
            .padding(vertical = 2.dp)
    )
}