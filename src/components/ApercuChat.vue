<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div v-if="!chat" class="row justify-between">
        <div v-if="affnai" class="titre-md text-italic q-mr-lg">{{$t('CHnch2b', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic q-mr-lg">{{$t('CHnch3b', [naE.nom])}}</div>
        <q-btn icon="edit" size="sm" color="warning" :label="$t('CHoch')" @click="editer"/>
      </div>
      <div v-else class="row justify-end">
        <div v-if="affnai" class="titre-md text-italic q-mr-lg">{{$t('CHoch2', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic q-mr-lg">{{$t('CHoch3', [naE.nom])}}</div>
        <div class="font-mono fs-md">{{dhcool(chat.dh) + ' #' + chat.seq}}</div>
      </div>
      <apercu-people v-if="!affnai" class="bordb" :id="naE.id" :idx="idx" />
      <apercu-motscles v-if="chat" @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
        :mapmc="mapmc" :edit="session.editable" :src="chat.mc || u0"/>
      <show-html v-if="chat" class="q-my-sm bord"
        :idx="idx" zoom edit scroll maxh="3rem" :texte="chat.txt" @edit="editer"/>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="chatedit" persistent>
      <editeur-md mh="20rem" :titre="$t('CHtxt')" help="page1"
        :texte="chat ? chat.txt : ''" editable modetxt :label-ok="$t('OK')" @ok="chatok"/>
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
import { MajMotsclesChat, NouveauChat, MajChat } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuChat',

  props: { naI: Object, naE: Object, ids: Number, idx: Number, mapmc: Object, affnai: Boolean },

  components: { ShowHtml, EditeurMd, ApercuMotscles, ApercuPeople },

  computed: { },

  data () { return {
    u0: new Uint8Array([]),
    dhcool: dhcool
  }},

  methods: {
    async editer () {
      if (this.session.mode === 3) {
        await afficherDiag(this.$t('CHav'))
      }
      const pSt = stores.people
      const csp = ID.estComptable(this.naE.id) || (pSt.estSponsor(this.naE.id) === 2)
      if (this.session.niv === 3 && !csp) {
        await afficherDiag(this.$t('CHbl'))
      }
      this.ovchatedit()
    },

    async chatok (txt) {
      if (!this.chat) {
        const [st, chat] = await new NouveauChat().run(this.naI, this.naE, txt)
        if (st === 0) {
          await afficherDiag(this.$t('OPnvch0'))
        } else  {
          this.chat = chat
          if (st === 2) await afficherDiag(this.$t('OPnvch2'))
        }
      } else {
        const [st, chat] = await new MajChat().run(this.naI, this.naE, txt, this.chat)
        this.chat = chat
        if (st === 2) await afficherDiag(this.$t('OPmajch2'))
      }
      MD.fD()
    },

    async changeMc (mc) {
      await new MajMotsclesChat().run(this.naI.id, this.ids, mc)
    }
  },

  setup (props) {
    const session = stores.session
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
      session,
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
