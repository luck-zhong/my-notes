# 光模块 HRx / HTx / LRx / LTx 参数

## 1. 四个位置的基本定义

在光模块中，常见可以把高速信号路径按 Host 侧和 Line/Media 侧拆成四个位置：

```text
Host ASIC / BERT / Switch
        ↓ electrical
HRx：模块接收 Host 侧电信号
        ↓
DSP
        ↓
LTx：模块发光到光纤
        ↓ optical
Fiber
        ↓ optical
LRx：模块接收光口来的信号
        ↓
DSP
        ↓
HTx：模块发电信号给 Host
        ↓ electrical
Host ASIC / BERT / Switch
```

简化理解：

```text
HRx：Host-side Rx，模块接收 Host 发来的电信号
HTx：Host-side Tx，模块发电信号给 Host
LRx：Line/Media-side Rx，模块接收光口来的光信号
LTx：Line/Media-side Tx，模块发光到光纤
```

一句话记忆：

```text
Rx 位置：重点看“收不收得到、锁不锁得住、对不对齐、误码高不高”
Tx 位置：重点看“有没有发、发得强不强、波形好不好、对端收得好不好”
```

---

## 2. HRx：模块接收 Host 侧电信号

### 2.1 位置

```text
Host ASIC / BERT / Switch
        ↓ electrical
模块 HRx
        ↓
DSP
        ↓
LTx 发光出去
```

HRx 是模块从主机侧接收高速电信号的位置，属于 Host-to-Media 方向的入口。

### 2.2 HRx 重点关注参数

| 参数                 | 含义                                               | 主要判断什么                               |
| -------------------- | -------------------------------------------------- | ------------------------------------------ |
| Signal Detect        | 输入信号检测                                       | Host 有没有真正送高速信号进来              |
| CDR Lock             | Clock Data Recovery lock，时钟数据恢复锁定         | DSP 能不能从 Host 电信号中恢复时钟         |
| LOL                  | Loss of Lock，失锁                                 | CDR 或 PLL 是否锁不住                      |
| CTLE                 | Continuous Time Linear Equalizer，连续时间线性均衡 | 补偿 Host 到模块之间的高频损耗             |
| DFE                  | Decision Feedback Equalizer，判决反馈均衡          | 消除后游标 ISI，提高判决质量               |
| VGA                  | Variable Gain Amplifier，可变增益放大              | 调整输入信号幅度                           |
| Adaptation Done      | 均衡自适应完成                                     | DSP 是否完成 HRx 均衡搜索                  |
| SNR / eSNR           | 信噪比 / 等效信噪比                                | PAM4 判决裕量是否足够                      |
| PAM4 Level           | PAM4 四电平分布                                    | 电平是否压缩、偏移、不均匀                 |
| LTP                  | Level Transition Parameter                         | PAM4 电平跳变质量                          |
| Block Lock           | PCS block lock                                     | 是否识别到 PCS 码块边界                    |
| AM Lock              | Alignment Marker lock                              | 是否识别到对齐标记                         |
| Lane Align           | 多 lane 对齐                                       | lane 顺序、deskew、AM marker 是否正确      |
| Polarity             | 极性                                               | P/N 是否反了，或 DSP polarity 设置是否正确 |
| Lane Map / Lane Swap | lane 映射                                          | Host lane 到 DSP lane 是否映射正确         |
| PRBS Checker Lock    | PRBS 检测器锁定                                    | 测试码型是否识别成功                       |
| PRBS Error Count     | PRBS 误码计数                                      | Host 输入方向是否有 bit error              |
| Pre-FEC BER          | FEC 前误码率                                       | Host 输入原始链路质量                      |
| Symbol Error         | 符号错误                                           | PCS/FEC 前后的符号级错误                   |

### 2.3 HRx 参数理解

HRx 的核心目标是：

```text
模块能不能正确接收 Host 发过来的高速电信号。
```

推荐判断顺序：

```text
Signal Detect
   ↓
CDR Lock
   ↓
EQ / Adaptation
   ↓
Block Lock
   ↓
AM Lock
   ↓
Lane Align
   ↓
Pre-FEC BER / PRBS Error
```

### 2.4 HRx 常见异常与排查方向

| 现象                            | 优先怀疑                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| HRx Signal Detect = 0           | Host 没发、电口断路、模块 DP 未激活                          |
| HRx CDR unlock                  | Host 速率不对、信号幅度差、CDR 配置错                        |
| HRx CDR lock 但 Block Lock fail | PCS/FEC 模式不匹配、polarity 错、pattern 不对                |
| HRx Lane Align fail             | lane map/swap 错、AM marker 异常、deskew 超限                |
| HRx Pre-FEC BER 高              | Host Tx FIR、模块 HRx EQ、电口 SI、连接器、温度              |
| 单 lane HRx BER 高              | 单 lane 通道损耗、焊接、连接器、Host lane 或 DSP lane 个体问题 |

---

## 3. HTx：模块发电信号给 Host

### 3.1 位置

```text
LRx 收光
        ↓
DSP
        ↓
模块 HTx
        ↓ electrical
Host ASIC / BERT / Switch
```

HTx 是模块输出给主机的高速电信号位置，属于 Media-to-Host 方向的出口。

### 3.2 HTx 重点关注参数

| 参数                            | 含义               | 主要判断什么                       |
| ------------------------------- | ------------------ | ---------------------------------- |
| Output Enable                   | 输出使能           | HTx 是否允许输出                   |
| Output Disable / Mute / Squelch | 输出关闭/静默      | 是否被固件、CMIS、故障策略关闭     |
| Output Status                   | 输出状态           | 当前 HTx lane 是否真正处于输出状态 |
| Output Amplitude                | 输出幅度           | 发给 Host 的电信号摆幅是否合适     |
| Pre-cursor                      | 前游标             | Tx FIR 主采样点前的补偿            |
| Main-cursor                     | 主游标             | 主信号幅度                         |
| Post-cursor                     | 后游标             | Tx FIR 主采样点后的补偿            |
| Tx FIR                          | 发射端 FIR 均衡    | 改善 Host 侧电眼图                 |
| Electrical Eye                  | 电眼图             | Host 端看到的信号裕量              |
| Jitter                          | 抖动               | 输出边沿时序稳定性                 |
| Rise/Fall Time                  | 上升/下降时间      | 输出边沿速度                       |
| Host-side BER                   | Host 侧误码        | Host 接收模块 HTx 后的链路质量     |
| Host-side PRBS Error            | Host checker error | BERT/Host 检测到的误码             |
| Polarity                        | 输出极性           | 输出 P/N 是否反向                  |
| Lane Map                        | 输出 lane 映射     | 模块输出 lane 与 Host 期望是否一致 |

### 3.3 HTx 参数理解

HTx 的核心目标是：

```text
模块发给 Host 的电信号，Host 能不能稳定接收。
```

HTx 和 HRx 的区别：

```text
HRx 是模块“接收 Host”。
HTx 是模块“发送给 Host”。
```

因此：

```text
HRx 重点看 CDR / EQ / Lock / BER。
HTx 重点看 Output / FIR / Amplitude / Eye。
```

### 3.4 HTx 常见异常与排查方向

| 现象                | 优先怀疑                                                  |
| ------------------- | --------------------------------------------------------- |
| HTx 没输出          | OutputDisable、squelch、DP 未激活、LRx 未 lock、Low Power |
| HTx 输出幅度低      | amplitude 配置、driver、电源、DSP output level            |
| HTx 眼图差          | Tx FIR、通道损耗、连接器、Host 接收能力                   |
| Host 侧 BER 高      | HTx FIR 不合适、Host Rx EQ 不收敛、电口 SI 差             |
| 只有某些交换机 fail | Host 端容限不同、HTx 参数 margin 不够                     |
| 单 lane fail        | lane 个体硬件、DSP lane、连接器、lane map                 |

---

## 4. LTx：模块发光到光纤

### 4.1 位置

```text
HRx 收 Host 电信号
        ↓
DSP
        ↓
Driver
        ↓
Laser / EML / DML / MZM
        ↓ optical
Fiber
```

LTx 是模块光发射端，关注本模块发出去的光质量好不好。

### 4.2 LTx 重点关注参数

| 参数                           | 含义                                     | 主要判断什么                      |
| ------------------------------ | ---------------------------------------- | --------------------------------- |
| Tx Optical Power               | 发射平均光功率                           | 是否发光，功率是否在范围内        |
| OMA                            | Optical Modulation Amplitude，光调制幅度 | 有效光调制幅度够不够              |
| ER                             | Extinction Ratio，消光比                 | 光 1 / 光 0 区分度                |
| TDECQ                          | PAM4 发射质量代价                        | PAM4 光发射质量是否合格           |
| Optical Eye                    | 光眼图                                   | 光信号眼高、眼宽、噪声、抖动      |
| RIN                            | Relative Intensity Noise，相对强度噪声   | 激光器强度噪声                    |
| Wavelength                     | 中心波长                                 | 波长是否在规格范围                |
| SMSR                           | Side Mode Suppression Ratio，边模抑制比  | 单模激光器边模是否足够低          |
| Tx Bias Current                | 激光器偏置电流                           | 激光器工作点是否正常              |
| Modulation Current             | 调制电流                                 | 影响 OMA / ER / 眼图              |
| Driver Swing                   | Driver 输出摆幅                          | 影响激光调制深度                  |
| TEC Current                    | TEC 电流                                 | 温控负载是否异常                  |
| Laser Temperature              | 激光器温度                               | 影响波长、功率、ER、稳定性        |
| Tx Disable                     | 光发射关闭                               | 是否被 host/固件关闭发光          |
| Tx Fault                       | 发射故障                                 | 激光器、driver、APC、保护机制异常 |
| APC Loop Status                | 自动功率控制状态                         | 光功率闭环是否正常                |
| MZM Bias / DML Bias / EML Bias | 调制器/激光器偏置                        | 影响线性度、ER、TDECQ             |

### 4.3 LTx 参数理解

LTx 的核心目标是：

```text
把 DSP 输出的数据转换成质量合格的光信号。
```

LTx 参数可以分成两类：

```text
控制量：
Bias、Modulation Current、Driver Swing、TEC、Tx FIR、MZM Bias

观测量：
Tx Power、OMA、ER、TDECQ、Eye、Wavelength、RIN、SMSR
```

### 4.4 关键参数说明

#### Tx Optical Power

发射平均光功率。

注意：

```text
Tx Power 正常 ≠ 光信号质量正常。
```

因为它只看平均功率，不看 PAM4 电平是否均匀、不看抖动、不看眼图闭合。

#### OMA

OMA 是光调制幅度，回答的是：

```text
光信号有效摆幅够不够？
```

OMA 太低，对端 LRx 判决困难，通常导致：

```text
对端 Rx margin 变小
对端 Pre-FEC BER 升高
对端 FEC corrected 增加
```

#### ER

ER 是消光比，看光 1 和光 0 的功率比例。

ER 偏低说明：

```text
光 1 和光 0 区分度不够。
```

可能原因：

```text
Bias 设置不合适
调制电流不合适
激光器老化
温度漂移
driver / laser 非线性
```

#### TDECQ

TDECQ 是 PAM4 光发射质量综合指标。它不是单纯功率，也不是单纯 ER，而是把眼图闭合、噪声、ISI、非线性等综合成一个代价值。

工程判断：

```text
TDECQ 越大，LTx 发射质量越差。
TDECQ fail 时，对端 Pre-FEC BER 往往更容易变差。
```

### 4.5 LTx 常见异常与排查方向

| 现象                       | 优先怀疑                                          |
| -------------------------- | ------------------------------------------------- |
| Tx Power 低                | APC、Bias、Laser、Driver、光路耦合                |
| Tx Power 正常但 TDECQ fail | Tx FIR、线性度、调制电流、Laser/Driver 带宽、噪声 |
| ER 低                      | Bias 过高/过低、调制深度不足、激光器状态          |
| OMA 低                     | 调制电流、driver swing、光耦合、laser 效率        |
| 波长漂移                   | TEC、laser temperature、波长控制                  |
| 单 lane 光差               | 单颗 laser、driver lane、耦合、通道校准           |
| 高温后 BER 差              | laser 温漂、Bias/APC 参数、TEC 能力不足           |
| 对端 LRx BER 高            | 本端 LTx 质量、光纤、对端 LRx EQ 都要看           |

---

## 5. LRx：模块接收光口来的信号

### 5.1 位置

```text
Fiber
        ↓ optical
TIA / PD / ADC
        ↓
模块 LRx
        ↓
DSP
        ↓
HTx 发电信号给 Host
```

LRx 是模块光接收端，关注本模块能不能把对端发来的光信号正确接收并解析。

### 5.2 LRx 重点关注参数

| 参数                   | 含义                           | 主要判断什么                   |
| ---------------------- | ------------------------------ | ------------------------------ |
| Rx Optical Power       | 接收光功率                     | 入光是否足够                   |
| LOS                    | Loss of Signal                 | 是否无光或弱光                 |
| RSSI                   | 接收信号强度                   | TIA/PD 侧输入强度              |
| TIA Gain               | TIA 增益                       | 光电转换后的放大状态           |
| ADC Range / Saturation | ADC 输入范围 / 饱和            | 输入是否过大或过小             |
| CDR Lock               | 光口方向 CDR 锁定              | 是否能从接收数据恢复时钟       |
| LOL                    | Loss of Lock                   | 光口接收失锁                   |
| CTLE / DFE / FFE       | LRx 接收均衡                   | 补偿光电链路损伤               |
| Adaptation Done        | 自适应完成                     | DSP 是否完成接收参数收敛       |
| SNR / eSNR             | 信噪比                         | PAM4 判决裕量                  |
| PAM4 Level             | 四电平分布                     | level 是否均匀、压缩、偏移     |
| LTP                    | PAM Level Transition Parameter | PAM4 电平跳变质量              |
| Block Lock             | PCS block lock                 | 是否识别码块边界               |
| AM Lock                | Alignment Marker lock          | 是否识别对齐标记               |
| Lane Align             | 多 lane 对齐                   | 多 lane 顺序和 deskew 是否正常 |
| FEC Lock               | FEC 同步                       | FEC 解码器是否进入同步         |
| Pre-FEC BER            | FEC 前误码率                   | 原始光链路质量                 |
| FEC Corrected          | FEC 已纠错                     | FEC 纠错压力                   |
| FEC Uncorrectable      | FEC 不可纠错                   | 错误是否超出 FEC 能力          |
| Post-FEC BER           | FEC 后误码率                   | 最终业务是否仍有错误           |
| FERC                   | FEC error count/rate           | FEC 错误计数或速率，具体看实现 |
| Codeword Error         | FEC 码字错误                   | FEC 层错误压力                 |
| Symbol Error           | 符号错误                       | PCS/FEC 前后符号错误           |

### 5.3 LRx 参数理解

LRx 的核心目标是：

```text
把对端发来的光信号接收、恢复、同步、纠错。
```

推荐判断顺序：

```text
Rx Power / LOS
   ↓
CDR Lock
   ↓
EQ / Adaptation / SNR
   ↓
Block Lock
   ↓
AM Lock / Lane Align
   ↓
FEC Lock
   ↓
Pre-FEC BER
   ↓
FEC Corrected / Uncorrectable
```

### 5.4 关键参数说明

#### Rx Power / LOS

Rx Power 只说明光功率强弱，LOS 是接收端判断是否丢信号。

注意：

```text
Rx Power 正常 ≠ LRx 一定能 lock。
Rx Power 正常 ≠ BER 一定好。
```

因为光功率正常时，仍然可能有：

```text
对端 TDECQ 差
光眼图闭合
反射大
色散问题
PAM4 level 差
LRx EQ 不收敛
FEC/PCS 模式不一致
```

#### LRx CDR Lock

表示从接收光信号转换后的电信号中恢复时钟成功。

异常时优先怀疑：

```text
Rx Power 太低
对端没有发光
对端速率不对
本端 CDR 配置不对
TIA / ADC 输入异常
光纤 / 连接器 / 衰减器问题
```

#### SNR / PAM4 Level / LTP

这些比 Rx Power 更接近“接收质量”。

如果出现：

```text
Rx Power 正常，但 Pre-FEC BER 高
```

就应该重点看：

```text
SNR / eSNR
PAM4 level
LTP
LRx EQ adaptation
对端 LTx TDECQ / OMA / ER
```

#### FEC Corrected / Uncorrectable

这是 LRx 最重要的工程判断指标之一。

```text
FEC Corrected 增加：
链路有错误，但还能纠回来。

FEC Uncorrectable 增加：
错误超过 FEC 能力，业务可能丢包、CRC error、link flap。

Post-FEC BER 不为 0：
已经影响业务，不能只说 link 是 up 的。
```

### 5.5 LRx 常见异常与排查方向

| 现象                          | 优先怀疑                                         |
| ----------------------------- | ------------------------------------------------ |
| Rx Power 低                   | 对端 LTx 低、光纤损耗、连接器脏、衰减器过大      |
| Rx Power 正常但 LOS           | LOS 门限、OMA 低、检测类型、TIA/PD 问题          |
| LRx CDR unlock                | 入光质量差、速率不对、CDR 配置、TIA/ADC 异常     |
| CDR lock 但 Block Lock fail   | PCS 模式不匹配、FEC mode、pattern、polarity      |
| Block Lock 但 Lane Align fail | lane map、AM marker、deskew、lane ordering       |
| Pre-FEC BER 高                | 对端 LTx、光链路、LRx EQ、SNR、温度              |
| FEC corrected 高              | 链路质量边缘，但还能纠错                         |
| FEC uncorrectable 增加        | 链路严重恶化，业务风险高                         |
| 单 lane LRx BER 高            | 单 lane 光路、TIA、PD、DSP lane、对端单 lane LTx |

---

## 6. 四个位置对照表

| 位置 | 方向           | 主要参数类型                                       | 典型问题                     |
| ---- | -------------- | -------------------------------------------------- | ---------------------------- |
| HRx  | Host → Module  | CDR、EQ、Block Lock、Lane Align、Host-side BER     | 模块收不懂 Host 发来的电信号 |
| LTx  | Module → Fiber | Tx Power、OMA、ER、TDECQ、Bias、Modulation         | 模块发出的光质量差           |
| LRx  | Fiber → Module | Rx Power、LOS、CDR、SNR、FEC、BER                  | 模块收不懂对端来的光信号     |
| HTx  | Module → Host  | Output Enable、Amplitude、Pre/Post、Electrical Eye | Host 收不懂模块发出的电信号  |

两条主路径：

```text
发射方向：Host → HRx → DSP → LTx → Fiber
接收方向：Fiber → LRx → DSP → HTx → Host
```

---

## 7. 工程排查方法

### 7.1 Host 到模块方向异常

典型现象：

```text
HRx CDR unlock
HRx BER 高
HRx align fail
```

优先检查：

```text
Host 是否发
Host 速率 / FEC / PCS 是否匹配
Host Tx FIR
模块 HRx EQ
Host lane map / polarity
```

---

### 7.2 模块发光异常

典型现象：

```text
本端 LTx TDECQ fail
OMA low
ER low
Tx Power abnormal
```

优先检查：

```text
Laser bias
Modulation current
Driver swing
Tx FIR
APC
TEC / laser temperature
光眼图
```

---

### 7.3 模块收光异常

典型现象：

```text
LRx LOS
LRx CDR unlock
LRx Pre-FEC BER high
```

优先检查：

```text
Rx Power
对端 LTx
光纤 / 连接器
LRx EQ
SNR / eSNR
FEC corrected / uncorrectable
```

---

### 7.4 模块发给 Host 异常

典型现象：

```text
HTx output abnormal
Host reports BER
Host CDR unlock
```

优先检查：

```text
HTx output enable
squelch / mute
amplitude
pre / post
electrical eye
Host Rx EQ
lane map / polarity
```

---

## 8. 固件工程师建议建立的参数表

后续可以按下面模板整理项目里的 DSP log、CMIS register 或 vendor register：

| 位置 | 参数              | 类型 | 含义              | 异常影响             | 优先排查                 |
| ---- | ----------------- | ---- | ----------------- | -------------------- | ------------------------ |
| HRx  | CDR Lock          | 状态 | Host 输入时钟恢复 | Host 数据无法解析    | Host 发信号 / 速率 / EQ  |
| HRx  | Pre-FEC BER       | 质量 | Host 输入误码     | LTx 方向数据质量差   | Host SI / HRx EQ         |
| LTx  | TDECQ             | 质量 | 光发射代价        | 对端 BER 高          | Bias / Mod / FIR / Laser |
| LTx  | OMA               | 质量 | 光调制幅度        | 对端接收裕量低       | Mod current / Driver     |
| LRx  | Rx Power          | 监控 | 接收光功率        | LOS / CDR unlock     | 光纤 / 对端 LTx          |
| LRx  | FEC Uncorrectable | 错误 | 不可纠错码字      | 业务错误 / link flap | 光链路 / LTx / LRx       |
| HTx  | Output Amplitude  | 控制 | 发给 Host 的摆幅  | Host BER 高          | Amplitude / FIR          |
| HTx  | Squelch           | 控制 | 输出静默          | Host 收不到数据      | DP 状态 / LRx 状态       |

---

## 9. 最短总结

```text
HRx：看 Host 电输入能不能被模块收懂。
LTx：看模块光输出质量好不好。
LRx：看对端光输入能不能被模块收懂。
HTx：看模块电输出能不能被 Host 收懂。
```

排查时先定位四个位置，再看参数，不要直接从 BER、ER、align 这些孤立名词开始。





# CTLE、DFE、FFE区别

| 项目             | CTLE                | DFE             | FFE/FIR               |
| ---------------- | ------------------- | --------------- | --------------------- |
| 类型             | 线性均衡            | 非线性/反馈均衡 | 线性前馈均衡          |
| 常见位置         | Rx 模拟前端         | Rx 判决反馈     | Tx 或 Rx              |
| 主要解决         | 高频损耗            | 后游标 ISI      | 前后游标 ISI / 预补偿 |
| 是否依赖判决结果 | 否                  | 是              | 否                    |
| 是否可能错误传播 | 否                  | 是              | 否                    |
| 常见配置名       | CTLE boost、peaking | DFE tap         | FIR tap、pre/post     |
| 对眼图影响       | 提升边沿、打开眼    | 消除拖尾        | 修正波形/预加重       |