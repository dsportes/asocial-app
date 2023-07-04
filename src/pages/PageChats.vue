<template>
  <q-page class="column q-pl-xs q-mr-sm largeur40 maauto">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-card class="q-my-md q-pa-xs row justify-center">
      <q-btn v-if="session.accesNet" size="md" class="q-ma-xs" no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/>

      <q-btn v-if="session.accesNet" size="md" no-caps class="q-ma-xs" dense color="primary" 
        :label="$t('CChtit')" @click="ovcc"/>
    </q-card>

    <div v-if="!aSt.pcLc.length" class="q-my-md titre-lg text-italic text-center">{{$t('CHnch')}}</div>
    <div v-if="aSt.pcLc.length && !aSt.pcLcF.length" class="q-my-md titre-lg text-italic text-center">
      {{$t('CHnch2', [aSt.pcLc.length])}}
    </div>

    <q-btn class="q-my-sm" flat color="primary" :label="$t('CHexp')" @click="exp" />
    
    <div v-if="aSt.pcLcF.length">
      <q-card class="q-my-md maauto" v-for="(chat, idx) in aSt.pcLcF" :key="chat.ids">
        <apercu-chat :na-i="chat.naI" :na-e="chat.naE" :ids="chat.ids" :idx="idx" :mapmc="mapmc"/>
      </q-card>
    </div>

    <q-dialog v-model="cc" persistent>
      <contact-chat/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import { saveAs } from 'file-saver'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import ApercuChat from '../components/ApercuChat.vue'
import ContactChat from '../dialogues/ContactChat.vue'
import { MD, Motscles } from '../app/modele.mjs'
import { RafraichirCvs } from '../app/operations.mjs'
import { dhstring, afficherDiag, photoToBin } from '../app/util.mjs'

// const img1 = '<img src="'
// const img2 = '" width="32" height="32" style="background-color:white">'
const img1 = '![photo](./'
const img2 = ')'
const encoder = new TextEncoder('utf-8')

export default {
  name: 'PageChats',

  components: { ApercuChat, ContactChat },

  computed: {
  },

  methods: {
    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(this.session.avatarId)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    },

    saveph (nf, u8, mime) {
      const blob = new Blob([u8], { type: mime })
      if (blob) saveAs(blob, nf)
    },

    async exp () {
      const expPfx = new Date().toISOString().replaceAll(':', '_')
      const res = []
      let nb = 1
      for (const c of this.aSt.pcLcF) {
        res.push('# ' + c.naE.nomc + '\n\n')
        if (c.cv) {
          if (c.cv.photo) {
            const [mime, bin] = photoToBin(c.cv.photo)
            const nf = encodeURI(expPfx + '_' + (nb++) + '.' + mime2ext(mime))
            this.saveph(nf, bin, mime)
            res.push('\n' + img1 + nf + img2 + '\n\n')
            // res.push('\n\n![Image en base64](' + c.cv.photo + ')\n\n')
          }
          if (c.cv.info) res.push(c.cv.info + '\n')
        }
        res.push('\n> ' + this.$t('CHnseq', [c.seq]))
        res.push('\n\n> ' + this.$t('CHdhc', [dhstring(c.dh)]) + '\n')
        res.push('\n' + c.txt + '\n\n---\n')
      }
      const buf = encoder.encode(res.join(''))
      const blob = new Blob([buf], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      if (blob) {
        const nf = encodeURI(expPfx + '_chats.md')
        saveAs(blob, nf)
      } else {
        await afficherDiag(this.$t('CHerr'))
      }
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const aSt = stores.avatar
    const session = stores.session
    const fStore = stores.filtre

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.contexte.chats.mapmc = mapmc.value
    fStore.contexte.chats.groupeId = 0

    const cc = ref(false)
    function ovcc () { MD.oD(cc) }

    return {
      MD, cc, ovcc,
      ui: stores.ui,
      session,
      aSt,
      mapmc
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
