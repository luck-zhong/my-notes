## 一、PID 控制简介

PID（Proportional–Integral–Derivative）是一种常见的 **闭环控制算法**，用于让系统输出跟踪目标值。

基本思想：

> 通过误差计算控制输出，使系统逐渐接近目标值。

控制结构：

```
目标值(setpoint)
      │
      ▼
   PID控制器
      │
      ▼
   被控对象
      │
      ▼
   系统输出
      │
      ▼
   反馈(feedback)
```

---

## 二、误差定义

PID 控制的核心是 **误差**：

```
error = setpoint - feedback
```

示例：

| 项       | 数值 |
| -------- | ---- |
| 目标温度 | 25°C |
| 当前温度 | 20°C |

```
error = 5
```

说明系统需要增加控制输出。

---

## 位置式 PID

### 数学公式

位置式 PID 的控制输出：

u(k) = Kp·e(k) + Ki·Σe(k) + Kd·(e(k) − e(k-1))

其中：

| 符号   | 含义       |
| ------ | ---------- |
| e(k)   | 当前误差   |
| e(k-1) | 上一次误差 |
| Kp     | 比例系数   |
| Ki     | 积分系数   |
| Kd     | 微分系数   |
| u(k)   | 控制输出   |

---

### P 项（比例）

```
P = Kp * e(k)
```

作用：

```
误差越大 → 控制越强
```

特点：

- 响应速度快
- 不能消除稳态误差

---

### I 项（积分）

```
I = Ki * Σe(k)
```

含义：

> 累积历史误差

作用：

```
消除稳态误差
```

---

### D 项（微分）

```
D = Kd * (e(k) - e(k-1))
```

含义：

```
误差变化速度
```

作用：

```
提前抑制过冲
```

---

### 位置式 PID 输出

```
u = P + I + D
```

嵌入式系统常见形式：

```
output = mid + P + I + D
```

---

### 控制流程

```
1 读取反馈值
2 计算 error
3 计算比例项 P
4 更新积分项 I
5 计算微分项 D
6 输出控制量
```

---

### 代码示例

```c
error = setpoint - feedback;

P_out = Kp * error;

integral += error;
I_out = Ki * integral;

D_out = Kd * (error - last_error);

output = mid + P_out + I_out + D_out;

last_error = error;
```

---

### 工程改进

**积分限幅**

```
限制积分最大值
```

**输出限幅**

```
DAC 0 ~ 4095
```

**积分分离**

```
误差过大时不进行积分
```

---

## 增量式 PID

### 基本思想

```
Δu(k) = 本次输出变化
u(k) = u(k-1) + Δu(k)
```

位置式：

```
u(k) = P + I + D
```

---

### 数学公式

```
Δu(k) =
Kp[e(k) − e(k-1)]
+ Ki e(k)
+ Kd[e(k) − 2e(k-1) + e(k-2)]
```

最终输出：

```
u(k) = u(k-1) + Δu(k)
```

---

### 增量式 PID 代码

```c
void pid_incremental(PID *pid)
{
    float error;
    float delta;

    error = pid->setpoint - pid->feedback;

    delta =
        pid->kp * (error - pid->last_error)
      + pid->ki * error
      + pid->kd * (error - 2*pid->last_error + pid->prev_error);

    pid->output += delta;

    pid->prev_error = pid->last_error;
    pid->last_error = error;
}
```

---



### 优缺点

优点：

- 不容易积分饱和
- 数值稳定
- 适合 MCU 控制

缺点：

- 依赖历史误差数据
- 输出可能累计误差

---

## 位置式 vs 增量式

| 项目     | 位置式   | 增量式   |
| -------- | -------- | -------- |
| 输出形式 | u        | u += Δu  |
| 积分方式 | 显式累积 | 隐式累积 |
| 稳定性   | 一般     | 更稳定   |
| MCU适配  | 一般     | 更好     |

---

### 工程口诀

```
P 决定响应速度
I 消除稳态误差
D 抑制过冲
```

调参经验：

```
先调 P
再调 I
D 一般不用
```

