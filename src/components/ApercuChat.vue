<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div v-if="!chat" class="row justify-between">
        <div v-if="affnai" class="titre-md text-italic q-mr-lg">{{$t('CHnch2b', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic q-mr-lg">{{$t('CHnch3b', [naE.nom])}}</div>
        <q-btn icon="edit" size="sm" color="warning" :label="$t('CHoch')" @click="editer"/>
      </div>
      <div v-if="chat && !chat._zombi" class="row justify-end">
        <div v-if="affnai" class="titre-md text-italic">{{$t('CHoch2', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic">{{$t('CHoch3', [naE.nom])}}</div>
        <div class="titre-md text-italic q-mx-md">{{$t(chat.r ? 'CHel' : 'CHrac')}}</div>
        <div class="font-mono fs-md">{{dhcool(chat.dh) + ' #' + chat.seq}}</div>
      </div>
      <div v-if="chat && chat._zombi" class="row justify-between">
        <div class="titre-md text-italic q-mr-lg">{{$t('CHnch3c', [naE.nom])}}</div>
      </div>
      <apercu-people v-if="!affnai && chat && !chat._zombi" class="bordb" :id="naE.id" :idx="idx" />
      <apercu-motscles v-if="chat" @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
        :mapmc="mapmc" :edit="session.editable" :src="chat.mc || u0"/>
      <show-html v-if="chat && chat.txt" class="q-my-sm bord"
        :idx="idx" zoom edit scroll maxh="4rem" :texte="chat.txt" @edit="editer"/>
      <q-btn v-if="chat && !chat.txt" flat color="primary" icon="check"
        :label="$t('CHreact')" @click="editer"/>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="chatedit" persistent>
      <q-card class="bs sp40 fs-md">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('CHtxt')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section>
          <editeur-md mh="20rem" v-model="txt" :texte="chat ? chat.txt : ''" editable modetxt/>
        </q-card-section>
        <q-card-actions vertical align="right">
          <q-btn :disable="!txt" flat color="primary" icon="send"
            :label="$t('CHenv')" @click="chatok(1)"/>
          <q-btn v-if="chat" flat color="warning" icon="call_end"
            :label="$t('CHrac')" @click="chatok(2)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool, afficherDiag, dkli } from '../app/util.mjs'
import ApercuMotscles from './ApercuMotscles.vue'
import ApercuPeople from './ApercuPeople.vue'
import BoutonHelp from './BoutonHelp.vue'
import { MajMotsclesChat, NouveauChat, MajChat } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuChat',

  props: { naI: Object, naE: Object, ids: Number, idx: Number, mapmc: Object, affnai: Boolean },

  components: { ShowHtml, EditeurMd, ApercuMotscles, ApercuPeople, BoutonHelp },

  computed: { 
    estSp () {
      const id = this.naE.id
      return ID.estComptable(id) || this.pSt.estSponsor(id)
    }
  },

  data () { return {
    u0: new Uint8Array([]),
    dhcool: dhcool,
    txt: ''
  }},

  methods: {
    async editer () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ovchatedit()
    },

    async chatok (op) { // 1:envoyer, 2:raccrocher
      if (!this.chat) {
        const [st, chat] = await new NouveauChat().run(this.naI, this.naE, this.txt)
        if (st === 0) {
          await afficherDiag(this.$t('OPnvch0'))
        } else  {
          this.chat = chat
          if (st === 2) await afficherDiag(this.$t('OPnvch2'))
        }
      } else {
        const [st, chat] = await new MajChat().run(op, this.naI, this.naE, this.txt, this.chat)
        this.chat = chat
        if (st) await afficherDiag(this.$t('OPmajch' + st))
      }
      MD.fD()
    },

    async changeMc (mc) {
      await new MajMotsclesChat().run(this.naI.id, this.ids, mc)
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const naI = toRef(props, 'naI')
    const naE = toRef(props, 'naE')
    const ids = toRef(props, 'ids')

    function getC () { return aSt.getChat(naI.value.id, ids.value) }

    const chat = ref(getC())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setChat' && args[0].id === naI.value.id && args[0].ids === ids.value) ||
          (name === 'delChat' && args[0] === naI.value.id && args[1] === ids.value)){
          chat.value = getC()
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naI.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naE.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'ids
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => ids.value, (ap, av) => {
        chat.value = getC()
      }
    )

    const chatedit = ref(false)
    function ovchatedit () { MD.oD(chatedit) }

    return {
      MD, chatedit, ovchatedit, dkli,
      session, pSt,
      chat
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 0 !important
  width: 1.5rem !important
</style>
