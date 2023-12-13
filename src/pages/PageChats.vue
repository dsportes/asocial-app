<template>
  <q-page class="column q-pl-xs q-mr-sm largeur40 maauto">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-card class="q-my-md q-pa-xs row justify-center">
      <q-btn v-if="session.accesNet" size="md" class="q-ma-xs" no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/>

      <q-btn v-if="session.accesNet" size="md" no-caps class="q-ma-xs" dense color="primary" 
        :label="$t('CChtit')" @click="ovContact"/>
    </q-card>

    <div class="q-my-md titre-lg text-italic text-center">
      {{$t('CHnch2', fusion.length, {count: fusion.length}) + ' ' + $t('CHnchtot', [aSt.nbchats + gSt.nbchats])}}
    </div>

    <div class="q-my-sm row justify-center items-center g-gutter-md">
      <q-btn dense color="primary" :label="$t('CHexp')" @click="exp" />
      <q-checkbox v-model="optb64" :label="$t('CHopt')" />
    </div>
    
    <div v-if="fusion.length">
      <div class="q-my-md maauto" v-for="(chat, idx) in fusion" :key="chat.id + '/' + chat.ids">
        <q-card v-if="ID.estGroupe(chat.id)">
          <div class="row justify-between">
            <div class="titre-lg text-italic q-mb-xs text-orange">{{$t('CHgr')}}</div>
            <q-btn color="warning" icon="open_in_new" @click="ouvrirChatgr(chat)"/>
          </div>
          <div :class="'column q-px-sm ' + dkli(idx)">
            <apercu-genx :id="chat.id" :idx="idx"/>
            <div class="q-mt-xs row justify-between items-center">
              <div class="text-italic fs-md">
                <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
              </div>
              <div v-if="chat.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</div>
            </div>
            <div v-if="chat.items.length" class="fs-md">{{chat.tit}}</div>
          </div>
        </q-card>

        <q-card v-else>
          <div :class="'column ' + dkli(idx)">
            <div class="row justify-between">
              <div class="titre-lg text-italic q-mb-xs text-orange">{{$t('CHde', [chat.naI.nom])}}</div>
              <q-btn color="warning" icon="open_in_new" @click="ouvrirChat(chat)"/>
            </div>
            <div class="q-mx-sm">
              <apercu-genx class="bordb" :id="chat.naE.id" :idx="idx" />
              <div class="q-mt-xs row justify-between items-center">
                <div class="text-italic fs-md">
                  <span v-if="chat.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
                  <span v-else class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</span>
                  <span v-if="chat.stE===0" class="q-mr-sm text-warning text-bold bg-yellow-5">
                    {{$t('CHraccroche2', [chat.naE.nom])}}</span>
                  <span v-if="chat.stE===2" class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHavdisp')}}</span>
                  <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
                </div>
                <div v-if="chat.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</div>
              </div>
              <div v-if="chat.items.length" class="fs-md">{{chat.tit}}</div>
            </div>
          </div>
        </q-card>

      </div>
    </div>

    <apercu-chat v-if="ui.d.ACouvrir" :naI="chatc.naI" :naE="chatc.naE" :ids="chatc.ids" :mapmc="mapmc"/>
    <apercu-chatgr v-if="ui.d.ACGouvrir"/>
    <contact-chat v-if="ui.d.CCouvrir"/>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import { saveAs } from 'file-saver'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import ApercuChat from '../components/ApercuChat.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuChatgr from '../components/ApercuChatgr.vue'
import ContactChat from '../dialogues/ContactChat.vue'
import { Motscles, getNg } from '../app/modele.mjs'
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

  components: { ApercuChat, ContactChat, ApercuChatgr, ApercuGenx },

  computed: {
  },

  methods: {
    cv (id) { 
      const g = this.gSt.getGroupe(id)
      return g ? g.cv : null
    },

    ouvrirChatgr (c) {
      this.session.setGroupeId(c.id)
      this.ui.oD('ACGouvrir')
    },

    ouvrirChat (c) {
      this.chatc = c
      this.ui.oD('ACouvrir')
    },

    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(this.session.avatarId)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    },

    async ovContact () {
      if (await this.session.edit()) this.ui.oD('CCouvrir')
    },

    saveph (nf, u8, mime) {
      const blob = new Blob([u8], { type: mime })
      if (blob) saveAs(blob, nf)
    },

    async exp () {
      const expPfx = new Date().toISOString().replaceAll(':', '_')
      const res = []
      let nb = 1
      for (const c of this.fusion) {
        if (ID.estGroupe(c.id)) {
          res.push('## ' + this.$t('CHoch2', [c.ng.nomc]) + '\n\n')
        } else {
          res.push('## ' + this.$t('CHoch3', [c.naI.nom, c.naE.nomc]) + '\n\n')
        }
        if (c.cv) {
          if (c.cv.photo) {
            const [mime, bin] = photoToBin(c.cv.photo)
            if (!this.optb64) {
              const nf = encodeURI(expPfx + '_' + (nb++) + '.' + mime2ext(mime))
              this.saveph(nf, bin, mime)
              res.push('\n' + img1 + nf + img2 + '\n\n')
            } else {
              res.push('\n\n![Image en base64](' + c.cv.photo + ')\n\n')
            }
          }
          if (c.cv.info) res.push(c.cv.info + '\n')
        }
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
      optb64: false,
      chatc: null
    }
  },

  setup () {
    const ui = stores.ui
    const aSt = stores.avatar
    const gSt = stores.groupe
    const session = stores.session
    const fStore = stores.filtre
    const fusion = ref()

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.setContexte('chats', { mapmc: mapmc.value, groupeId : 0})

    function init () {
      const r = []
      aSt.tousChats.forEach(c => { r.push(c)})
      gSt.tousChats.forEach(c => { r.push(c)})
      r.sort((a, b) => { return a.dh > b.dh ? -1 : (a.dh === b.dh ? 0 : 1) })
      session.fmsg(r.length)
      fusion.value = r
    }

    init()

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setFiltre') init()
      })
    })

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setChat' || name === 'delChat') init()
      })
    })

    gSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setChatgr' || name === 'del') init()
      })
    })

    return {
      session, ui, aSt, gSt, ID, dkli, fusion, getNg, dhcool,
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
