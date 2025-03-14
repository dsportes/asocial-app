<template>
<div class="column justify-center bg-grey-7 full-width">
  <canvas ref="canvas" class="d-none"></canvas>
  <div class="row justify-center">
    <img :src="imgZUrl"
      :class="noir ? 'bg-black' : 'bg-white'"/>
  </div>
  <div class="imgbar bg-transparent row items-center">
    <btn-cond icon="chevron_left" size="lg" @ok="ui.fD" color="black" flat/>
    <q-toggle v-if="png" v-model="noir" class="bg-grey-7"
      dense color="black"/>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import { u8ToB64, afficherDiag } from '../app/util.mjs'

const props = defineProps({
  note: Object,
  fic: Object
})

const ui = stores.ui

const scrH = computed(() => ui.screenHeight )
const scrW = computed(() => ui.screenWidth ) 
const canvas = ref()
const imgZUrl = ref()
const noir = ref(true)
const png = ref(props.fic.type.indexOf('png') !== -1)

onMounted(async () => {
  const u8 = await props.note.getFichier(props.fic)
  if (!u8) {
    await afficherDiag($t('PNFgetEr'))
    return
  }
  const url = 'data:' + props.fic.type + ';base64,' + u8ToB64(u8)
  const img = new Image()
  await new Promise(r => img.onload=r, img.src=url)
  const w = img.width
  const h = img.height
  const rh = scrH.value / h
  const rw = scrW.value / w
  let r = rh < rw ? rh : rw 
  if (r > 1) r = 1 // pas de réduction
  const wi = w * r
  const hi = h * r
  canvas.value.width = wi
  canvas.value.height = hi
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, wi, hi)
  ctx.drawImage(img, 0, 0, wi, hi)
  imgZUrl.value = canvas.value.toDataURL(props.fic.type)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.d-none
  display: none
.imgbar
  position: absolute
  padding: 0
  margin: 0
  max-height: 24px
  overflow: hidden
  top: -4px
  left: 0
</style>