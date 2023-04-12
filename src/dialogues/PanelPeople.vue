<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [pStore.peC.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card class="q-pa-sm">
      <apercu-people :id="session.peopleId" simple />
      <div class="row">
        <div v-if="avStore.mbPeC">
          <div v-if="avStore.mbPeC.sp" class="titre-md text-bold text-warning">
            {{$t('PPsp', [avStore.tribuC.na.nom])}}</div>
          <div v-else class="titre-md">{{$t('PPco', [avStore.tribuC.na.nom])}}</div>
        </div>
      </div>

      <barre-people v-if="session.estComptable || session.estSponsor" :na="pStore.peC.na"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <div v-for="(na, idx) in avStore.compta.lstAvatarNas" :key="na.id">
        <apercu-chat class="q-my-md" affnai
          :na-i="na" :na-e="pStore.peC.na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

    </q-card>
  </q-page-container>
</q-layout>
</template>
<script>

import { ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import { Chat, Motscles } from '../app/modele.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuPeople, BoutonHelp, ApercuChat, BarrePeople },

  props: { close: Function },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
  },
  
  data () {
    return {
    }
  },

  methods: {
    fermer () { if (this.close) this.close() },
  },

  setup (props) {
    const session = stores.session
    const pStore = stores.people
    const avStore = stores.avatar

    const mapmc = ref(Motscles.mapMC(true, 0))

    const ids = reactive({})
    onMounted(async () => {
      for(const na of avStore.compta.lstAvatarNas) {
        ids[na.id] = await Chat.getIds(na, pStore.peC.na)
      }
    })

    return {
      session,
      avStore,
      pStore,
      mapmc,
      ids
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
.bord2
  background: $yellow-3
  color: black
  font-weight: bold
.q-card__section
  padding: 2px !important
.q-btn
  padding: 0 3px !important
</style>
