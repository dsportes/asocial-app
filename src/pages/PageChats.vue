<template>
  <q-page class="column q-pl-xs q-mr-sm spmd">

    <div class="q-mt-xs q-pa-xs row justify-around items-center">
      <btn-cond class="q-my-sm" 
        :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"
        :label="$t('CVraf')" @ok="rafCvs"/>
      <sel-avid aucun/>
    </div>

    <q-separator color="primary" class="q-my-xs q-mx-lg"/>

    <div class="q-pa-xs row justify-center items-center">
      <div class="titre-md text-italic q-mr-md">{{$t('CHcrpc')}}</div>
      <btn-cond :disable="!session.avatarId" icon="open_in_new" 
        :label="$t('CHbtncr')" @ok="creerChat()"
        :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
    </div>

    <q-separator color="orange" class="q-my-xs"/>

    <div class="row justify-center items-center g-gutter-md">
      <btn-cond :label="$t('CHexp')" @ok="exp" />
      <q-checkbox v-model="optb64" :label="$t('CHopt')" />
    </div>

    <q-separator color="primary" class="q-my-xs q-mx-lg"/>

    <div class="titre-md text-italic text-center">
      {{$t('CHnch2', fusion.length, {count: fusion.length}) + ' ' + $t('CHnchtot', [aSt.nbchats + gSt.nbchats])}}
    </div>

    <div v-if="fusion.length">
      <q-expansion-item v-for="(chat, idx) in fusion" :key="chat.id + '/' + chat.ids"
        :header-class="dkli(idx)" switch-toggle-side expand-separator dense group="somegroup">
        <template v-slot:header>
          <micro-chatgr v-if="ID.estGroupe(chat.id)" class="full-width" :chat="chat"/>
          <micro-chat v-else class="full-width" :chat="chat"/>
        </template>
        <apercu-genx class="q-ml-xl" :id="ID.estGroupe(chat.id) ? chat.id : chat.idE" :idx="idx"/>
      </q-expansion-item>
    </div>

    <nouveau-chat v-if="ui.d[idc] && ui.d[idc].CCouvrir" :idc="idc" :idI="session.avatarId" :mode="0"/>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

import { saveAs } from 'file-saver'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import MicroChat from '../components/MicroChat.vue'
import MicroChatgr from '../components/MicroChatgr.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import NouveauChat from '../dialogues/NouveauChat.vue'
import SelAvid from '../components/SelAvid.vue'
import BtnCond from '../components/BtnCond.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { dhstring, afficher8000, afficherDiag, photoToBin, dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

// const img1 = '<img src="'
// const img2 = '" width="32" height="32" style="background-color:white">'
const img1 = '![photo](./'
const img2 = ')'
const encoder = new TextEncoder('utf-8')

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const aSt = stores.avatar
const gSt = stores.groupe
const session = stores.session
const fStore = stores.filtre

const idI = ref(0)
const optb64 = ref(false)
const chatc = ref(null)

const avChats = computed(() => {
  const f = fStore.filtre.chats
  const ci = session.compti
  const flimj = f.nbj ? (Date.now() - (f.nbj * 86400000)) : 0
  const fsetp = f.mcp && f.mcp.size ? f.mcp : null
  const fsetn = f.mcn && f.mcn.size ? f.mcn : null
  const r = []
  for (const [,elt] of aSt.map) {
    if (!f.tous && session.avatarId !== elt.avatar.id) continue
    for (const [,c] of elt.chats) {
      if (f.nonlus && !c.nonlu) continue
      if (f.avecmut && !c.mutI && !c.mutE) continue
      if (f.rac === 1 && c.stI === 0) continue
      if (f.rac === 2 && c.stI === 1) continue
      if (flimj && c.dh > flimj) continue
      if (f.nom) {
        const cv = session.getCV(c.idE)
        if (!cv.nom.startsWith(f.nom) && (!ci.stW(c.idE, f.nom))) continue
      }
      if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
      if (fsetp && !ci.aHT(c.idE, fsetp)) continue
      if (fsetn && ci.aHT(c.idE, fsetn)) continue
      r.push(c)
    }
  }
  return r
})

const grChats = computed(() => {
  const f = fStore.filtre.chats
  const ci = session.compti
  const r = []
  if (!f.tous) return r
  const flimj = f.nbj ? (Date.now() - (f.nbj * 86400000)) : 0
  const fsetp = f.mcp && f.mcp.size ? f.mcp : null
  const fsetn = f.mcn && f.mcn.size ? f.mcn : null
  for (const [,elt] of gSt.map) {
    const c = elt.chatgr
    const cv = session.getCV(c.idE)
    if (c) {
      if (f.nonlus && elt.dhLectChat >= c.dh) continue
      if (flimj && c.dh > flimj) continue
      if (f.nom && !cv.nom.startsWith(f.nom) && (!ci.stW(c.idE, f.nom))) continue
      if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
      if (fsetp && !ci.aHT(c.idE, fsetp)) continue
      if (fsetn && ci.aHT(c.idE, fsetn)) continue
      r.push(c)
    }
  }
  return r
})

const avid = computed(() => session.avatarId)
const fusion = computed(() => {
  const f = fStore.filtre.chats // afin d'être sensible au changement de filtre
  const r = []
  avChats.value.forEach(c => { r.push(c)})
  grChats.value.forEach(c => { r.push(c)})
  r.sort((a, b) => a.dh > b.dh ? -1 : (a.dh === b.dh ? 0 : 1))
  return r
})

watch(fusion, (ap) => { ui.fmsg(ap.length)})

async function rafCvs () {
  let nc = 0, nv = 0
  if (session.avatarId) {
      const r = await new RafraichirCvsAv().run(session.avatarId)
      if (typeof r === 'number') {
        await afficher8000(r, avid.value, 0)
        return
      }
      const [x, y] = r
      nc += x; nv += y
  } else
    for (const id of session.compte.mav) {
      const r = await new RafraichirCvsAv().run(id)
      if (typeof r === 'number') {
        await afficher8000(r, id, 0)
        return
      }
      const [x, y] = r
      nc += x; nv += y
    }
  ui.afficherMessage($t('CVraf2', [nc, nv]))
}

function creerChat () {
  ui.oD('CCouvrir', idc)
}

function saveph (nf, u8, mime) {
  const blob = new Blob([u8], { type: mime })
  if (blob) saveAs(blob, nf)
}

async function exp () { // export des chats
  const expPfx = new Date().toISOString().replaceAll(':', '_')
  const res = []
  let nb = 1
  for (const c of fusion.value) {
    const cv = session.getCV(ID.estGroupe(c.id) ? c.id : c.idE)
    if (ID.estGroupe(c.id)) {
      res.push('## ' + $t('CHoch2', [cv.nomC]) + '\n\n')
    } else {
      const cvI = session.getCV(c.id)
      res.push('## ' + $t('CHoch3', [cvI.nom, cv.nomC]) + '\n\n')
    }
    if (cv.ph) {
      const [mime, bin] = photoToBin(cv.photo)
      if (!this.optb64) {
        const nf = encodeURI(expPfx + '_' + (nb++) + '.' + mime2ext(mime))
        this.saveph(nf, bin, mime)
        res.push('\n' + img1 + nf + img2 + '\n\n')
      } else {
        res.push('\n\n![Image en base64](' + cv.photo + ')\n\n')
      }
    }
    if (cv.tx) res.push(cv.tx + '\n')
    res.push('\n\n> ' + $t('CHdhc', [dhstring(c.dh)]) + '\n')
    res.push('\n' + c.txt + '\n\n---\n')
  }
  const buf = encoder.encode(res.join(''))
  const blob = new Blob([buf], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  if (blob) {
    const nf = encodeURI(expPfx + '_chats.md')
    saveAs(blob, nf)
    await afficherDiag($t('CHexpok'))
  } else {
    await afficherDiag($t('CHerr'))
  }
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
