<script lang="ts" setup>
import logoAlipay from "@@/assets/images/sponsor/alipay.jpg?url"
import logoWechat from "@@/assets/images/sponsor/wechat.jpg?url"
</script>

<template>
  <!-- 如果您觉得本项目对您有帮助，可以赞助作者一根辣条 -->
  <div style="text-align: center;">
    <h1>赞助作者</h1>
    <p>如果您觉得本项目对您有帮助，可以赞助作者一根辣条</p>
    <div>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <img width="50%" :src="logoWechat" alt="微信赞助">
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <img width="50%" :src="logoAlipay" alt="支付宝赞助">
        </el-col>
      </el-row>
    </div>
  </div>
</template>
