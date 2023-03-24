<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div v-if="!chat" class="row justify-end">
        <div v-if="affnai" class="titre-md text-italic q-mr-lg">{{$t('CHnch2', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic q-mr-lg">{{$t('CHnch3', [naE.nom])}}</div>
        <q-btn icon="edit" size="sm" color="warning" :label="$t('CHoch')" @click="editer"/>
      </div>
      <div v-else class="row justify-end">
        <div v-if="affnai" class="titre-md text-italic q-mr-lg">{{$t('CHoch2', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic q-mr-lg">{{$t('CHoch3', [naE.nom])}}</div>
        <div class="font-mono fs-md">{{dhcool(chat.dh)}}</div>
      </div>
      <apercu-people v-if="!affnai" class="bordb" :id="naE.id" :idx="idx" simple/>
      <apercu-motscles v-if="chat" @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
        :mapmc="mapmc" :edit="session.editable" :src="chat.mc || u0"/>
      <div v-if="chat" class="row items-start">
        <show-html class="col q-mr-sm bord" :idx="idx" zoom maxh="3rem" :texte="chat.txt"/>
        <div class="col-auto self-start"><q-btn class="btn1" icon="edit" size="sm" color="warning" @click="editer"/></div>
      </div>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="chatedit" persistent>
      <q-card class="moyennelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CHtxt')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="chatedit=false"/>
        </q-toolbar>
        <editeur-md ref="memoed" style="height:70vh"
          :texte="chat.txt" editable modetxt :label-ok="$t('OK')" @ok="chatok"/>
      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool } from '../app/util.mjs'
import ApercuMotscles from './ApercuMotscles.vue'
import ApercuPeople from './ApercuPeople.vue'
import { MajMotsclesChat, SetChats, ReactivationChat } from '../app/operations.mjs'
import { IDCOMPTABLE } from 'src/app/api.mjs'

export default {
  name: 'ApercuChat',

  props: { naI: Object, naE: Object, ids: Number, idx: Number, mapmc: Object, affnai: Boolean },

  components: { ShowHtml, EditeurMd, ApercuMotscles, ApercuPeople },

  computed: { },

  data () { return {
    u0: new Uint8Array([]),
    chatedit: false,
    dhcool: dhcool
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (this.session.mode === 3) {
        await afficherDiag(this.$t('CHav'))
      }
      const csp = this.naE.id === IDCOMPTABLE || (stores.people.estSponsor(this.naE.id) === 2)
      if (this.session.nivbl === 3 && !csp) {
        await afficherDiag(this.$t('CHbl'))
      }
      if (this.chat) {
        this.chatedit = true
        return
      }
      const [disp, chat] = await new ReactivationChat().run(this.naI, this.naE)
      if (disp) {
        await afficherDiag(this.$t('CHdisp'))
        return
      }
      this.chat = chat
      this.chatedit = true
    },

    async chatok (txt) {
      await new SetChats().run(this.chat, txt)
      this.chatedit = false
    },

    async changeMc (mc) {
      await new MajMotsclesChat().run(this.naI.id, this.ids, mc)
    }
  },

  setup (props) {
    const session = stores.session
    const avStore = stores.avatar
    const naI = toRef(props, 'naI')
    const naE = toRef(props, 'naE')
    const ids = toRef(props, 'ids')

    function getC () { return avStore.getChat(naI.value.id, ids.value) }

    const chat = ref(getC())

    avStore.$onAction(({ name, args, after }) => {
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

    return {
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
