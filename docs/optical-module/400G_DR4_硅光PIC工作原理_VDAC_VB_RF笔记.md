# 400G DR4 硅光 PIC 工作原理笔记

> 适用范围：典型 400GBASE-DR4、CW Laser + 硅光 Mach–Zehnder Modulator（MZM）PIC 架构。  
> 注意：不同厂商对 `VB(Bias)`、`VDAC(Heater)`等引脚的命名可能不同。本文给出的是行业中最常见的功能模型，最终应以具体 PIC datasheet、原理图和 Driver 连接方式为准。

---

## 1. PIC 是什么

PIC（Photonic Integrated Circuit，光子集成电路）可以理解为“在芯片上实现的光学电路”。

电子芯片使用金属走线、电阻、电容和晶体管处理电信号；PIC 则使用：

- 光波导（Waveguide）
- 分光器（Splitter）
- 合光器（Combiner）
- 相位调制器（Phase Shifter）
- Mach–Zehnder 调制器（MZM）
- 热光调相器（Heater / Thermo-Optic Phase Shifter）
- 光功率监控器（Tap Coupler + Monitor Photodiode）
- 输入/输出耦合器（Edge Coupler / Grating Coupler）

处理和控制光。

PIC 通常不等于整个光模块。一个典型 400G DR4 发射链路是：

```text
Host Electrical Lanes
        │
        ▼
       DSP
        │  4 × 100G PAM4 高速电信号
        ▼
   MZM Driver
        │  RF 高速驱动
        ▼
┌──────────────────── Silicon Photonics PIC ────────────────────┐
│                                                                │
│ CW Laser → 输入耦合 → 1×4 分光 → 4 路 MZM → 监控/输出耦合       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
       FAU
        │
        ▼
4 路单模发送光纤
```

---

## 2. 400G DR4 中 PIC 的总体作用

典型 400G DR4 使用四条并行光通道：

```text
Electrical Lane 0 → Optical Lane 0：100G PAM4
Electrical Lane 1 → Optical Lane 1：100G PAM4
Electrical Lane 2 → Optical Lane 2：100G PAM4
Electrical Lane 3 → Optical Lane 3：100G PAM4
```

PIC 在发射方向主要完成：

1. 接收 CW Laser 提供的连续光；
2. 把连续光分配到四个发射通道；
3. 使用每通道 MZM 将高速 PAM4 电信号转换成光功率变化；
4. 调整每个 MZM 的静态干涉工作点；
5. 在需要时降低或关闭通道输出光；
6. 分出少量光供 MPD 监控；
7. 将调制光耦合到 FAU 和外部光纤。

---

## 3. CW Laser 与 PIC 的关系

### 3.1 CW Laser 提供光载波

CW 是 Continuous Wave，即连续波。

CW Laser 输出近似稳定的连续光：

```text
光功率
  │ ─────────────────────────────
  └──────────────────────────────→ 时间
```

这束光：

- 提供能量和光载波；
- 波长位于目标工作范围；
- 本身没有承载高速 PAM4 数据。

MZM 的作用不是产生光，而是控制已有的连续光如何变化。

### 3.2 一束光如何变成四路

PIC 中通常使用 1×4 Splitter：

```text
                         ┌── CH0 MZM
CW Laser → 输入耦合 → Splitter ├── CH1 MZM
                         ├── CH2 MZM
                         └── CH3 MZM
```

理想 1 分 4 会使每路获得总功率的四分之一，相当于约 6.02 dB 的功率分配：

\[
10\log_{10}(1/4) \approx -6.02\ \mathrm{dB}
\]

实际还要叠加：

- Laser-to-PIC 耦合损耗；
- 波导传播损耗；
- Splitter 额外损耗；
- MZM 插入损耗；
- Tap/MPD 分光损耗；
- PIC-to-FAU 耦合损耗。

---

## 4. MZM 的基本结构

Mach–Zehnder Modulator 的简化结构：

```text
                         上臂
                    ┌──────────────┐
输入光 → 1×2 分光器 ┤              ├→ 2×1 合光器 → 输出光
                    └──────────────┘
                         下臂
```

输入光被分成两束，分别经过上、下两条波导，再重新合并。

输出光功率取决于两束光重新合并时的相位差。

### 4.1 相长干涉

两臂光相位接近一致：

```text
上臂：↑ ↑ ↑ ↑
下臂：↑ ↑ ↑ ↑
```

合并后相互增强，输出光功率较高。

### 4.2 相消干涉

两臂光相差约 180°：

```text
上臂：↑ ↑ ↑ ↑
下臂：↓ ↓ ↓ ↓
```

合并后相互抵消，输出光功率较低。

### 4.3 简化传输关系

理想 MZM 的输出可近似表示为：

\[
P_{\text{out}}(t)
=
P_{\text{in}}
\cos^2\left(\frac{\Delta\phi(t)}{2}\right)
\]

其中：

- \(P_{\text{in}}\)：输入光功率；
- \(P_{\text{out}}\)：输出光功率；
- \(\Delta\phi(t)\)：上、下两臂的相位差。

因此，MZM 的核心不是直接改变光功率，而是：

```text
先改变两臂相位差
        ↓
再通过干涉
        ↓
把相位变化转换成光功率变化
```

---

## 5. 电压为什么可以改变光相位

光在波导中传播所积累的相位近似为：

\[
\phi = \frac{2\pi}{\lambda} n_{\mathrm{eff}} L
\]

其中：

- \(\lambda\)：光波长；
- \(n_{\mathrm{eff}}\)：波导有效折射率；
- \(L\)：传播长度；
- \(\phi\)：累积相位。

因此，只要改变有效折射率 \(n_{\mathrm{eff}}\)，就能改变相位。

硅本身没有很强的线性电光效应，高速硅光调制通常利用自由载流子等离子色散效应：

```text
外加电压
   ↓
PN/PIN 结中的电子、空穴分布改变
   ↓
硅波导有效折射率及吸收改变
   ↓
光相位改变
```

两臂相位变化不同，就形成随时间变化的 \(\Delta\phi(t)\)，最终使输出光功率随高速电信号变化。

---

## 6. RF、VB、VDAC 的职责划分

这是理解实际 PIC 的核心。

### 6.1 最常见的功能模型

```text
RF：
高速 PAM4 驱动信号，负责逐符号产生高速相位变化。

VB：
高速 PN 结相移器的直流结偏置，通常是反向偏置；
为高速调制器建立合适的电气工作条件。

VDAC：
低速光学工作点控制，通常驱动 Heater 或低速相移器；
用于设置 MZM 的静态干涉工作点。
```

更准确地说，PIC 内部可能存在两种不同的相位调节结构：

```text
高速相移器：PN/PIN 结
    输入：VB + RF
    作用：高速数据调制

低速相移器：Heater 或慢速 PN 相移器
    输入：VDAC
    作用：静态相位校准、工作点锁定、开关光
```

### 6.2 不要把两个 Bias 混在一起

行业资料中的 “Bias” 经常指两种不同概念：

| 术语 | 实际含义 | 典型硬件信号 |
|---|---|---|
| Optical Bias / MZM Bias | MZM 在传输曲线上的静态工作点 | VDAC |
| Junction Bias / Reverse Bias | 高速 PN 结的直流偏置 | VB |

因此：

```text
MZM optical bias ≈ VDAC
PN junction bias ≈ VB
```

---

## 7. RF 的作用

RF 是 DSP 经 MZM Driver 输出的高速 PAM4 电信号。

每条 100G 光通道使用 PAM4，每个符号有四个电平：

```text
RF Level 0
RF Level 1
RF Level 2
RF Level 3
```

RF 使高速 PN 结中的载流子分布快速变化，产生高速相位变化：

```text
PAM4 电压
   ↓
高速 PN 结相位变化
   ↓
MZM 两臂相位差变化
   ↓
输出形成四个光功率电平
```

接收端根据四个光功率电平恢复每符号 2 bit 数据。

注意：

- RF 不是“直接增加或减少光功率”；
- RF 首先调制相位；
- MZM 干涉结构再把相位调制转换为强度调制。

---

## 8. VB 的作用

### 8.1 最常见含义

VB 通常是高速 PN 结相移器的直流反向偏置。

高速结电压可抽象为：

\[
V_{\mathrm{junction}}(t)
=
V_B + v_{\mathrm{RF}}(t)
\]

具体正负号取决于厂商引脚极性、Driver 连接和电压定义。

### 8.2 VB 主要影响

#### PN 结工作区

VB 使 PN 结处于目标耗尽状态，避免 RF 摆动把结推入不希望的正向导通区。

#### 结电容与带宽

通常，适当增加反向偏置会使耗尽层变宽、结电容下降，从而有利于高速带宽：

```text
反向偏置变化
   ↓
耗尽层宽度变化
   ↓
结电容变化
   ↓
高速响应和 Driver 负载变化
```

#### 相移效率

在不同 VB 下，相同 RF 摆幅可能产生不同的相位变化，所以 VB 会间接影响：

- OMA；
- ER；
- PAM4 电平间距；
- 所需 RF 摆幅；
- 眼图质量。

#### 光损耗

载流子变化同时影响折射率和自由载流子吸收，因此 VB 也可能影响：

- 插入损耗；
- 平均输出光功率；
- 两臂功率平衡。

### 8.3 VB 通常不作为主要开关光手段

虽然改变 VB 也可能改变光相位和输出，但它会同时改变：

- 结电容；
- 调制带宽；
- Driver 负载；
- 调制效率；
- 光损耗；
- 电压可靠性余量。

所以正常工程设计中，VB 通常保持在器件推荐值，不用于频繁开关光。

---

## 9. VDAC 的作用

VDAC 通常用于控制 Heater 或低速相位调节器。

它改变 MZM 两臂之间的静态相位差：

\[
\Delta\phi_{\mathrm{static}}
=
\Delta\phi_{\mathrm{process}}
+
\Delta\phi_{\mathrm{temperature}}
+
\Delta\phi_{\mathrm{VDAC}}
\]

VDAC 的主要功能：

1. 补偿制造导致的两臂光程差；
2. 补偿温度、应力和老化漂移；
3. 将 MZM 设置在正常调制工作点；
4. 配合 MPD 和 Dither 实现自动偏置控制；
5. 在 Tx Disable 时，将通道移动到 Null 附近实现低光输出。

### 9.1 为什么每通道 VDAC 不同

四个 MZM 通道可能存在不同的：

- 波导长度误差；
- Heater 阻值；
- 热效率；
- 局部温度；
- 光耦合损耗；
- 芯片应力；
- 初始相位误差。

因此很常见：

```text
CH0 VDAC = 0.62 V
CH1 VDAC = 0.74 V
CH2 VDAC = 0.57 V
CH3 VDAC = 0.81 V
```

而 VB 可能四通道使用相同推荐值，因为四个高速 PN 相移器的结构和电气工作条件相近。

---

## 10. 总相位模型

把制造误差、温度、VDAC 和 RF 合并起来，可以写成：

\[
\Delta\phi(t)
=
\Delta\phi_{\mathrm{process}}
+
\Delta\phi_{\mathrm{temperature}}
+
\Delta\phi_{\mathrm{VDAC}}
+
\Delta\phi_{\mathrm{RF}}(t)
\]

其中：

- \(\Delta\phi_{\mathrm{process}}\)：制造固有差异；
- \(\Delta\phi_{\mathrm{temperature}}\)：温度引起的漂移；
- \(\Delta\phi_{\mathrm{VDAC}}\)：低速工作点调整；
- \(\Delta\phi_{\mathrm{RF}}(t)\)：高速 PAM4 数据相位变化。

最终：

\[
P_{\mathrm{out}}(t)
=
P_{\mathrm{in}}
\cos^2\left(\frac{\Delta\phi(t)}{2}\right)
\]

可以总结为：

```text
VB 决定高速 PN 结“以什么电气条件工作”
VDAC 决定 MZM“位于干涉曲线的什么位置”
RF 决定光功率“按照什么高速数据变化”
```

---

## 11. MZM 工作点

理想 MZM 传输曲线近似周期性：

```text
输出光功率
  │       Peak               Peak
  │        ●                  ●
  │      ╱   ╲              ╱   ╲
  │    ╱       ╲          ╱       ╲
  │  ● Q         ╲      ╱
  │                ● Null
  └────────────────────────────────→ VDAC / 静态相位
```

典型位置：

- Peak：输出光功率最大附近；
- Null：输出光功率最小附近；
- Quadrature：曲线斜率较大处；
- PAM4 优化点：未必严格等于理想 Quadrature，要结合 Driver 摆幅、线性化、OMA 和各眼高优化。

### 11.1 VDAC 改变时会发生什么

VDAC 改变相当于把整个 RF 摆动区间沿传输曲线平移。

正常位置时：

```text
VDAC 将 RF 四个电平放在合适的曲线区域
→ 形成可区分的四个光功率电平
```

VDAC 错误时：

- 四级光功率间距不均；
- 上、中、下眼不对称；
- 平均光功率变化；
- OMA 下降；
- ER 异常；
- 电平压缩或交叉；
- BER 变差。

---

## 12. “正常调制”与“开关光”是否冲突

只要改变 VDAC，就一定会改变 MZM 静态工作点，因此一定会影响光信号。

但系统不会在正常传输时随意改变 VDAC 来关光，同时还要求数据保持正确。

### 正常发送状态

```text
Laser：开启
VB：保持推荐偏置
VDAC：锁定在校准工作点
RF：正常输出 PAM4
结果：输出正确的 PAM4 光信号
```

### Tx Disable / 关光状态

```text
RF：关闭或静音
VDAC PID：冻结或关闭
VDAC：移到 Null/关光点
Laser：根据方案保持开启或关闭
结果：输出光功率降低，不再要求数据正确
```

因此：

> 关光时输出数据失真是预期行为，因为系统目标已从“正确传输”切换为“输出足够低的光功率”。

---

## 13. 为什么仅把 VDAC 拉到 Null 仍可能漏光

Null 是传输曲线的谷底，但并非理想无限深的零输出。

原因包括：

- 上、下两臂功率不完全一致；
- Splitter / Combiner 不理想；
- VDAC 控制精度有限；
- 温度漂移；
- MZM 有限消光比；
- RF 仍在 Null 两侧摆动；
- Driver 残余输出；
- 偏振和耦合误差；
- 光学串扰。

如果 RF 仍然开启，即使中心位于 Null，RF 大摆幅也会使瞬时工作点离开谷底，产生残余调制光。

所以工程上常采用组合关光：

```text
1. 静音或关闭 MZM Driver
2. 冻结/关闭自动 VDAC PID
3. 将 VDAC 移到 Null/关光值
4. 必要时关闭 Laser 或使用 VOA
5. 通过 MPD 或外部光功率计确认关光功率
```

---

## 14. 开光与关光的典型时序

### 14.1 开光

```text
1. 电源稳定
2. 配置 VB 到器件推荐值
3. 打开并稳定 CW Laser / Laser TEC
4. 配置 VDAC 初始值
5. 扫描或恢复每通道校准工作点
6. 启动 VDAC Control / Dither Loop
7. 启用 MZM Driver
8. 解除 Tx Disable / Squelch
9. 读取 MPD、Tx Power、温度和故障状态
10. 确认链路和 BER
```

实际顺序依赖具体 Driver 和 PIC。例如，有些方案要求先关闭 RF 再扫描 VDAC；有些 Driver 对 VB、共模和 RF Enable 有严格时序。

### 14.2 关光

```text
1. 接收到 Tx Disable、DPSM 关断或内部故障请求
2. 静音/关闭 RF
3. 冻结自动 VDAC PID
4. 将 VDAC 移到关光值
5. 必要时关闭 Laser 或降低激光电流
6. 确认输出功率满足关光要求
```

---

## 15. MPD、Tap Coupler 与 Bias Control

PIC 中通常会从主光路分出少量光：

```text
主光路 ──┬────────→ FAU / 光纤
         │
         └→ Tap Coupler → MPD → TIA/ADC → MCU
```

MPD 可以用于：

- 监控输入 CW 光；
- 监控每通道输出平均光功率；
- 在 VDAC 扫描时寻找 Peak/Null；
- 检测 Dither 响应；
- 为自动偏置控制提供反馈；
- 检测无光、弱光或通道异常。

注意：

- MPD 通常监测的是分出的少量光；
- MPD 的位置可能在 MZM 前，也可能在 MZM 后；
- 不同 MPD 位置代表不同物理量；
- 只看平均光功率，不能证明 PAM4 眼图或 BER 正常。

---

## 16. 自动偏置控制的基本思想

由于温度、工艺和老化会使 MZM 工作点漂移，系统可能通过低频 Dither 闭环维持目标点：

```text
VDAC 上叠加很小的低频扰动
        ↓
MPD 检测输出光功率中的对应响应
        ↓
算法判断当前位于 Peak、Null 还是目标斜率
        ↓
缓慢调整 VDAC
        ↓
维持目标工作点
```

Dither 的频率远低于 PAM4 RF，不用于传输业务数据。

固件注意事项：

- 正常发送时 VDAC 只能小步、慢速调整；
- 不应让 VDAC PID 与关光动作互相抢控制权；
- 强制关光前应冻结或关闭环路；
- 恢复发送时应先恢复工作点，再打开 RF；
- 各通道应有独立状态、目标值和故障保护。

---

## 17. PIC 发射通道的推荐抽象模型

```text
                      ┌──── RF+ / RF− ← MZM Driver ← DSP
                      │
                高速 PN 相移器
                      │
VB ── Junction Bias ──┤
                      │
CW 光 → Splitter → MZM 两臂 → Combiner → Tap/MPD → FAU
                      │
              低速相位调节器
                      │
VDAC ── Heater/Slow PS┘
```

软件可以将每个通道抽象为：

```c
typedef struct
{
    float vb_target;
    float vdac_normal;
    float vdac_tx_disable;
    float mpd_value;
    float tx_power;

    bool rf_enabled;
    bool bias_loop_enabled;
    bool tx_enabled;

    enum
    {
        PIC_CH_OFF,
        PIC_CH_BIAS_SEARCH,
        PIC_CH_STABILIZING,
        PIC_CH_ACTIVE,
        PIC_CH_TX_DISABLE,
        PIC_CH_FAULT
    } state;
} pic_tx_channel_t;
```

---

## 18. 常见错误认知

### 错误 1：MZM 自己产生光

错误。MZM通常调制外部 CW Laser 提供的光。

### 错误 2：RF 直接让光变亮、变暗

不够准确。RF首先改变相位，MZM干涉再把相位变化转换成光功率变化。

### 错误 3：VB 就是 MZM 工作点电压

在常见硅光 PIC 中，VB 更可能是高速 PN 结反向偏置；MZM 光学工作点通常由 VDAC 控制。

### 错误 4：VDAC 和 RF 必须在同一电极直接相加

不一定。它们可能作用于两个不同物理相移器，但在“总光学相位差”层面共同叠加。

### 错误 5：关闭 RF 就一定无光

错误。关闭 RF 后，MZM 仍可能停留在有较高静态输出的位置。

### 错误 6：VDAC 拉到 Null 就绝对无光

错误。实际 MZM 有限消光比、漂移和残余 RF，通常只能做到足够低的输出。

### 错误 7：平均 Tx Power 正常就代表信号正常

错误。平均功率正常时，OMA、ER、PAM4 电平线性和 BER 仍可能异常。

---

## 19. 调试方法

### 19.1 VDAC 扫描

条件：

- CW Laser 稳定；
- RF 关闭或按厂商要求处理；
- VB 固定在推荐值；
- 记录 MPD 或外部光功率计。

预期：

```text
VDAC 扫描
   ↓
输出光功率呈周期性或近似周期性起伏
   ↓
可识别 Peak、Null 和中间工作区
```

可验证：

- Heater/慢速相移器是否有效；
- 通道最佳工作点；
- Null 深度；
- 控制方向；
- 通道间差异；
- 温漂量。

### 19.2 VB 扫描

只应在器件允许范围内，并满足 Driver 和可靠性要求。

关注：

- Driver 电流；
- 结电压范围；
- RF 带宽；
- OMA；
- ER；
- 平均光功率；
- PAM4 眼高；
- BER；
- 器件温度。

VB 扫描主要不是为了找 Peak/Null，而是评估高速相移器的电气和调制性能。

### 19.3 RF 调试

关注：

- RF 差分摆幅；
- 共模电压；
- 终端匹配；
- AC/DC 耦合方式；
- Driver Enable；
- Pre/Post Cursor；
- 上升下降时间；
- 眼图；
- 与 VB 组合后的瞬时最大/最小结电压。

### 19.4 无光故障树

```text
无光
├─ CW Laser 未出光
├─ Laser-to-PIC 耦合失败
├─ Splitter / Waveguide 路径异常
├─ VDAC 位于 Null
├─ VDAC/Heater 驱动失败
├─ VB 极性或电压错误
├─ Driver/PIC 引脚连接错误
├─ VOA 关闭（若存在）
├─ PIC-to-FAU 耦合失败
└─ MPD/ADC 监控链路误判
```

### 19.5 有光但 BER 差

```text
有光但 BER 差
├─ VDAC 工作点偏移
├─ VB 不合适导致带宽/效率异常
├─ RF 摆幅过大或过小
├─ RF 共模或终端错误
├─ PAM4 电平压缩/不均
├─ OMA 或 ER 不合格
├─ Driver 均衡不合适
├─ 温度漂移
├─ CW 光功率波动
├─ 通道光损耗或耦合异常
└─ DSP/FEC/接收链路问题
```

---

## 20. 工程最佳实践

1. **始终区分 Optical Bias 与 Junction Bias。**
2. **在代码和文档中明确写 `mzm_optical_bias_vdac` 与 `pn_reverse_bias_vb`，不要都叫 `bias`。**
3. **VB 使用厂商推荐值和上电时序，不能仅凭光功率扫描决定。**
4. **VDAC 校准值按通道保存，并附带温度条件、版本和校验。**
5. **关光动作必须与 VDAC PID 做所有权仲裁。**
6. **开 RF 前确认 VDAC 已恢复并稳定。**
7. **用 MPD 做监控，但用眼图、OMA、ER 和 BER 判断信号质量。**
8. **做 VB/RF 极限组合检查，确保 PN 结瞬时电压不越过绝对最大额定值。**
9. **区分“停止调制”“通道低光”“激光器关闭”和“CMIS Tx Disable”。**
10. **没有 datasheet 时，不要假设 VDAC 一定驱动 Heater，也不要假设 VB 一定是共用反向偏置；必须从引脚、电流量级和连接方式验证。**

---

# 深入阅读资料

以下资料按推荐阅读顺序排列。

## 1. Low-Cost 400 Gbps DR4 Silicon Photonics Transmitter for Short-Reach Datacenter Application

- 作者：H. Zhu 等
- 年份：2021
- 价值：最贴近 400G DR4 应用，包含 100 Gb/s/lane 硅光发射机、MZI 调制器和系统实现。
- 在线全文：
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8401463/

建议重点阅读：

- transmitter architecture；
- modulator design and characterization；
- 100G PAM4 per lane；
- DR4 系统测试。

## 2. Increase in Modulation Speed of Silicon Photonics Mach–Zehnder Modulators

- 作者：K. Ogawa
- 年份：2024
- 期刊：Photonics
- 价值：较新的综述，系统介绍硅光 MZM 的结构、PN 结、带宽限制和高速设计。
- 在线全文：
  https://www.mdpi.com/2304-6732/11/6/535

建议重点阅读：

- MZM 结构；
- carrier-depletion phase shifter；
- PN 结电容和 RC 带宽；
- traveling-wave electrode。

## 3. Silicon Photonic Phase Shifters and Their Applications

- 作者：H. Sun 等
- 年份：2022
- 期刊：Micromachines
- 价值：系统比较热光、载流子耗尽、注入式和其他相移器，适合理解 VDAC 与 VB 为什么对应不同物理结构。
- 在线全文：
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9504597/

建议重点阅读：

- thermo-optic phase shifter；
- free-carrier depletion phase shifter；
- 功耗、速度、插入损耗和调相效率比较。

## 4. High Performance Mach-Zehnder Based Silicon Optical Modulators

- 作者：D. J. Thomson 等
- 年份：2013
- 价值：经典 carrier-depletion silicon MZM 综述，帮助理解反向偏置 PN 结、高速电极和调制效率。
- PDF：
  https://eprints.soton.ac.uk/361425/1/JSTQE_20Invited_20paper_20-_20submitted.pdf

建议重点阅读：

- plasma dispersion effect；
- depletion modulator；
- \(V_\pi L\)；
- traveling-wave MZM；
- 光损耗与效率权衡。

## 5. Low Voltage 25 Gbps Silicon Mach–Zehnder Modulator in the O-Band

- 年份：2017
- 期刊：Optics Express
- 价值：O-band 与 DR4 波段接近，文中明确使用 Heater 将 MZM 调到 Quadrature，并分析不同反向偏置下的静态响应和调制效率。
- 页面：
  https://opg.optica.org/oe/abstract.cfm?uri=oe-25-10-11217

建议重点阅读：

- Heater optical bias；
- reverse voltage；
- static transfer curve；
- modulation efficiency；
- electro-optic bandwidth。

## 6. Silicon Photonic Mach-Zehnder Modulator Architectures for On-Chip PAM-4 Signal Generation

- 作者：A. Samani 等
- 年份：2019
- 价值：直接讨论 O-band 硅光 MZM 和 PAM4 架构，适合理解四电平的光学形成和 MZM 非线性。
- PDF：
  https://orca.cardiff.ac.uk/id/eprint/122197/1/08678845.pdf

建议重点阅读：

- PAM4 generation；
- MZM architecture；
- segmented / dual-parallel structures；
- optical linearity。

## 7. A 100-Gb/s PAM4 Optical Transmitter in a 3-D-Integrated Silicon Photonics Platform

- 年份：2022
- 期刊：IEEE Journal of Solid-State Circuits
- 价值：从电子 Driver 与硅光 MZM 协同设计角度理解 RF、共模、分段 MZM、摆幅和 PAM4。
- PDF：
  https://www.mics.caltech.edu/wp-content/uploads/2022/11/JSSC-2022-MOSCAP-Arian-Hashemi.pdf

建议重点阅读：

- driver–modulator co-design；
- push-pull segmented MZM；
- electrical loading；
- 100-Gb/s PAM4。

## 8. AIM Photonics Academy: Photonic Integrated Circuits – Mach-Zehnder Modulator

- 类型：教学视频
- 价值：适合先建立分光、两臂相位变化和合光干涉的直观认识。
- 视频：
  https://www.youtube.com/watch?v=HTHcJjtm6TU

---

# 推荐阅读顺序

```text
第 1 步：AIM Photonics MZM 教学视频
   ↓
第 2 步：Silicon Photonic Phase Shifters and Their Applications
   ↓
第 3 步：Increase in Modulation Speed of Silicon Photonics MZM
   ↓
第 4 步：Low-Cost 400G DR4 Silicon Photonics Transmitter
   ↓
第 5 步：Low Voltage O-Band Silicon MZM
   ↓
第 6 步：PAM4 MZM Architecture / 100G PAM4 Driver Co-design
```

---

# 最终记忆框架

```text
CW Laser
    │ 提供连续光
    ▼
PIC Splitter
    │ 分成 4 路
    ▼
每通道 MZM
    ├─ VB：高速 PN 结的基础直流偏置
    ├─ RF：高速 PAM4 相位调制
    └─ VDAC：低速静态相位/工作点控制
    │
    ▼
两臂干涉
    │ 将相位变化转换成光功率变化
    ▼
Tap + MPD
    │ 监控及 Bias 闭环
    ▼
FAU
    │
    ▼
4 路 DR4 输出光纤
```

一句话总结：

> 在典型 400G DR4 硅光 PIC 中，CW Laser 提供连续光，VB 为高速 PN 结相移器建立合适的电气偏置，RF 携带 PAM4 高速数据并产生快速相位变化，VDAC 通过 Heater 或低速相移器设置 MZM 的静态干涉工作点；MZM 再利用两臂干涉，把总相位变化转换为可传输的四级光功率信号。
