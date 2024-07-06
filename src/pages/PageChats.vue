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
              <div class="titre-lg text-italic q-mb-xs text-orange">{{$t('CHde', [session.getCV(chat.id).nom])}}</div>
            </div>
            <div class="q-mx-sm">
              <apercu-genx class="bordb" :id="chat.idE" :idx="idx" />
              <micro-chat :chat="chat"/>
            </div>
          </div>
        </q-card>

      </div>
    </div>

    <nouveau-chat v-if="ui.d.CCouvrir[idc]" :idc="idc" :idI="session.avatarId" :mode="0"/>

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
import SelAvid from '../components/SelAvid.vue'
import BtnCond from '../components/BtnCond.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { dhstring, afficher8000, afficherDiag, photoToBin, dkli, dhcool } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

// const img1 = '<img src="'
// const img2 = '" width="32" height="32" style="background-color:white">'
const img1 = '![photo](./'
const img2 = ')'
const encoder = new TextEncoder('utf-8')

export default {
  name: 'PageChats',

  components: { BtnCond, SelAvid, MicroChat, MicroChatgr, NouveauChat, ApercuGenx },

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
    },
    avid () { return this.session.avatarId }
  },

  watch: {
    avid (ap) {
      console.log(ap)
    }
  },

  methods: {
    async rafCvs () {
      let nc = 0, nv = 0
      if (this.session.avatarId) {
          const r = await new RafraichirCvsAv().run(this.session.avatarId)
          if (typeof r ==='number') {
            await afficher8000(r, this.session.avatarId, 0)
            return
          }
          const [x, y] = r
          nc += x; nv += y
      } else
        for (const id of this.session.compte.mav) {
          const r = await new RafraichirCvsAv().run(id)
          if (typeof r ==='number') {
            await afficher8000(r, id, 0)
            return
          }
          const [x, y] = r
          nc += x; nv += y
        }
      stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
    },

    creerChat () {
      this.ui.oD('CCouvrir', this.idc)
    },

    saveph (nf, u8, mime) {
      const blob = new Blob([u8], { type: mime })
      if (blob) saveAs(blob, nf)
    },

    async exp () { // export des chats
      const expPfx = new Date().toISOString().replaceAll(':', '_')
      const res = []
      let nb = 1
      for (const c of this.fusion) {
        const cv = this.session.getCV(ID.estGroupe(c.id) ? c.id : c.idE)
        if (ID.estGroupe(c.id)) {
          res.push('## ' + this.$t('CHoch2', [cv.nomc]) + '\n\n')
        } else {
          const cvI = this.session.getCV(c.id)
          res.push('## ' + this.$t('CHoch3', [cvI.nom, cv.nomc]) + '\n\n')
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
