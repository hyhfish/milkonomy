<script lang="ts" setup>
import logoAlipay from "@@/assets/images/sponsor/alipay.jpg?url"
import logoPaypal from "@@/assets/images/sponsor/paypal.jpg?url"
import logoWechat from "@@/assets/images/sponsor/wechat.jpg?url"
import { Link } from "@element-plus/icons-vue"
import axios from "axios"
import { ElLoading, type FormRules } from "element-plus"

const url = "https://script.google.com/macros/s/AKfycbzA8s6SOQDoFi27VuQ9wqqjQDZuLcjGVdfH-3DIO32ayYFI29u3dxWV3Y4_Q6geT3Kr/exec"

const sponsorList = ref<Sponsor[] >([])
const sponsorLoading = ref(false)

const refForm = ref()
const form = ref<Sponsor>({})
const dialogVisible = ref(false)
const dialogLoading = ref(false)
let loadingService: any
const rules = reactive<FormRules>({
  nickname: [{ required: true, message: "不能为空", trigger: ["blur", "change"] }],
  platform: [{ required: true, message: "不能为空", trigger: ["blur", "change"] }],
  name: [{ required: true, message: "不能为空", trigger: ["blur", "change"] }],
  amount: [{ required: true, message: "不能为空", trigger: ["blur", "change"] }]
})
watch(dialogLoading, (val) => {
  if (val) {
    loadingService = ElLoading.service({
      lock: true,
      target: ".dialog"
    })
  } else {
    loadingService.close()
  }
})
function submit() {
  refForm.value.validate((valid: boolean) => {
    if (valid) {
      dialogLoading.value = true
      fetch(url, {
        // 解决跨域问题
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(form.value),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        }
      })
        .then(() => {
          ElMessage.success("提交成功，请等待作者审核")
          dialogVisible.value = false
          loadData()
        })
        .catch((e) => {
          ElMessage.error(e)
        })
        .finally(() => {
          dialogLoading.value = false
        })
    }
  })
}
loadData()

interface Sponsor {
  approved?: boolean
  nickname?: string
  platform?: string
  name?: string
  amount?: number
  date?: Date
}
// 加载审核通过的数据
function loadData() {
  sponsorLoading.value = true
  axios.get(url)
    .then(({ data }) => {
      console.log("data", data)
      sponsorList.value = data.map(([approved, nickname, platform, name, amount, date]: any) => {
        return { approved, nickname, platform, name, amount, date: new Date(date) } as Sponsor
      })
    })
    .catch((e) => {
      ElMessage.error(e)
    })
    .finally(() => {
      sponsorLoading.value = false
    })
}
function onPaypal() {
  window.open("https://paypal.me/luyh7")
}
</script>

<template>
  <div style="text-align: center;">
    <h1>打赏作者</h1>
    <p>如果您觉得本项目对您有帮助，可以打赏作者一根辣条</p>
    <div>
      <el-row :gutter="20" class="img-row">
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <el-card>
            <img width="80%" :src="logoWechat" alt="微信打赏">
            <div class="img-alt">
              WeChat
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <el-card>
            <img width="80%" :src="logoAlipay" alt="支付宝打赏">
            <div class="img-alt">
              Alipay
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <el-card style="cursor:pointer" @click="onPaypal">
            <img width="80%" :src="logoPaypal" alt="Paypal打赏">
            <el-link :icon="Link" underline type="primary" class="img-alt" style="display:flex">
              PayPal
            </el-link>
          </el-card>
        </el-col>
      </el-row>
    </div>
    <el-card class="sponsor-list">
      <template #header>
        打赏者名单&nbsp;
        <el-button type="primary" @click="dialogVisible = true">
          我要上榜
        </el-button>
      </template>
      <el-table v-loading="sponsorLoading" :data="sponsorList">
        <el-table-column label="排名" width="60">
          <template #default="{ $index }">
            <span>{{ $index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            <span>¥{{ row.amount }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog class="dialog" v-model="dialogVisible" title="我要上榜" :show-close="false">
      <el-form :model="form" ref="refForm" class="form" :rules="rules">
        <el-form-item prop="nickname" label="昵称">
          <el-input v-model="form.nickname" placeholder="打赏者名单上显示的名字" />
        </el-form-item>
        <el-form-item prop="platform" label="平台">
          <el-select v-model="form.platform" placeholder="请选择">
            <el-option label="支付宝" value="支付宝" />
            <el-option label="微信" value="微信" />
            <el-option label="Paypal" value="Paypal" />
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="姓名">
          <el-input v-model="form.name" placeholder="您支付时使用的名字" />
        </el-form-item>
        <el-form-item prop="amount" label="金额">
          <el-input v-model="form.amount" placeholder="CNY" />
        </el-form-item>
        <el-form-item>
          提交后请等待作者审核，审核通过后会显示在打赏者名单中
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="text-align: center;">
          <el-button type="primary" @click="submit">
            提交
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-link__inner) {
  display: block;
}
.img-row {
  margin: 20px !important;
  .el-col {
    margin-bottom: 20px;
  }
}
.img-alt {
  font-size: 2vw;
  font-weight: bold;
  margin: 10px 0 20px 0;
}
.sponsor-list {
  margin: 20px;
  text-align: left;
}
.form {
  margin: 20px;
}
</style>
