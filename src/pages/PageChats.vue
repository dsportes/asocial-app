<template>
  <q-page class="column q-pl-xs q-mr-sm spmd">

    <div class="q-my-xs q-pa-xs row justify-around">
      <q-btn v-if="session.accesNet" size="md" padding="xs xs" 
        no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/>

<!-- A REPRENDRE : choisir l'avatar du compte idI et BtnCond
      <q-btn v-if="session.accesNet" size="md" no-caps 
        dense color="primary" padding="xs xs"
        :label="$t('CChtit')" @click="creerChat"/>
-->
    </div>

    <div class="row justify-center items-center g-gutter-md">
      <q-btn dense color="primary" padding="xs xs" :label="$t('CHexp')" @click="exp" />
      <q-checkbox v-model="optb64" :label="$t('CHopt')" />
    </div>

    <div class="q-mt-xs titre-md text-italic text-center">
      {{$t('CHnch2', fusion.length, {count: fusion.length}) + ' ' + $t('CHnchtot', [aSt.nbchats + gSt.nbchats])}}
    </div>

    <div v-if="fusion.length">
      <div class="q-my-md maauto" v-for="(chat, idx) in fusion" :key="chat.id + '/' + chat.ids">
        <q-card v-if="ID.estGroupe(chat.id)">
          <div class="row justify-between">
            <div class="titre-lg text-italic q-mb-xs text-orange">{{$t('CHgr')}}</div>
          </div>
          <div :class="'column q-px-sm ' + dkli(idx)">
            <apercu-genx :id="chat.id" :idx="idx"/>
            <micro-chatgr :chat="chat"/>
          </div>
        </q-card>

        <q-card v-else>
          <div :class="'column ' + dkli(idx)">
            <div class="row justify-between">
              <div class="titre-lg text-italic q-mb-xs text-orange">{{$t('CHde', [session.getCV(chat.idE).nom])}}</div>
            </div>
            <div class="q-mx-sm">
              <apercu-genx class="bordb" :id="chat.idE" :idx="idx" />
              <micro-chat :chat="chat"/>
            </div>
          </div>
        </q-card>

      </div>
    </div>

    <nouveau-chat v-if="ui.d.CCouvrir[idc]" :idc="idc" :idI="idI"/>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import { saveAs } from 'file-saver'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import MicroChat from '../components/MicroChat.vue'
import MicroChatgr from '../components/MicroChatgr.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import NouveauChat from '../dialogues/NouveauChat.vue'
import { RafraichirCvs } from '../app/operations.mjs'
import { dhstring, afficherDiag, photoToBin, dkli, dhcool } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

// const img1 = '<img src="'
// const img2 = '" width="32" height="32" style="background-color:white">'
const img1 = '![photo](./'
const img2 = ')'
const encoder = new TextEncoder('utf-8')

export default {
  name: 'PageChats',

  components: { MicroChat, MicroChatgr, NouveauChat, ApercuGenx },

  computed: {
    fusion () {
      const f = this.fStore.filtre.chats // afin d'être sensible au changement de filtre
      const r = []
      this.aSt.tousChats.forEach(c => { r.push(c)})
      this.gSt.tousChats.forEach(c => { r.push(c)})
      r.sort((a, b) => { return a.dh > b.dh ? -1 : (a.dh === b.dh ? 0 : 1) })
      this.ui.fmsg(r.length)
      // console.log(Date.now())
      return r
    }
  },

  methods: {
    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(this.session.avatarId)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    },

    creerChat () {
      this.ui.oD('CCouvrir', this.idc)
    },

    saveph (nf, u8, mime) {
      const blob = new Blob([u8], { type: mime })
      if (blob) saveAs(blob, nf)
    },

    async exp () { // export des contacts - A VERIFIER
      const expPfx = new Date().toISOString().replaceAll(':', '_')
      const res = []
      let nb = 1
      for (const c of this.fusion) {
        if (ID.estGroupe(c.id)) {
          res.push('## ' + this.$t('CHoch2', [c.ng.nomc]) + '\n\n')
        } else {
          res.push('## ' + this.$t('CHoch3', [c.naI.nom, c.naE.nomc]) + '\n\n')
        }
        const cv = this.session.getCV(id)
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
        if (cv.tx) res.push(cv.photo + '\n')
        res.push('\n\n> ' + this.$t('CHdhc', [dhstring(c.dh)]) + '\n')
        res.push('\n' + c.txt + '\n\n---\n')
      }
      const buf = encoder.encode(res.join(''))
      const blob = new Blob([buf], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      if (blob) {
        const nf = encodeURI(expPfx + '_chats.md')
        saveAs(blob, nf)
        await afficherDiag(this.$t('CHexpok'))
      } else {
        await afficherDiag(this.$t('CHerr'))
      }
    }
  },

  data () {
    return {
      idI: 0,
      optb64: false,
      chatc: null
    }
  },

  setup () {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const aSt = stores.avatar
    const gSt = stores.groupe
    const session = stores.session
    const fStore = stores.filtre

    return {
      session, ui, idc, aSt, gSt, fStore, 
      ID, dkli, dhcool
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
