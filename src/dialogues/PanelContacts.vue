<template>
  <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense color="warning" size="md" icon="chevron_left" @click="ui.panelContacts=false"/>
        <q-toolbar-title class="titre-lg full-width text-right q-pr-sm">{{$t('PCti')}}</q-toolbar-title>
      </q-toolbar>
      <div class="row items-center bg-primary text-white">
        <span class="text-italic q-mr-sm">{{$t('PCnom')}}</span>
        <q-select class="q-ml-sm" v-model="cf" :options="optfiltre"
          style="width:5rem" dense options-dense map-options/>
        <q-input class="q-ml-sm" v-model="txt" style="width:3rem" dense placeholder="abc"/>
        <q-select class="q-ml-sm" v-model="tri" :options="opttri" style="width:6rem" dense options-dense map-options/>
      </div>
    </q-header>

    <q-page-container>
      <div class="filler"/>
      <div v-if="!lst.length" class="titre-md text-italic">{{$t('PCvi')}}</div>
      <div v-else>
        <div v-for="(c, idx) in lst" :key="c.na.id" class="q-my-md">
          <fiche-people class="zone" :idx="idx" :people="c"/>
          <q-separator/>
        </div>
        <div class="filler"/>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { watch, computed } from 'vue'
import stores from '../stores/stores.mjs'
import FichePeople from './PanelPeople.vue'

export default ({
  name: 'PanelContacts',

  components: { FichePeople },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
    tri (ap) { this.contacts.setTri(ap.value) },
    cf (ap) { this.contacts.setFiltre(this.cf.value, this.txt) },
    txt (ap) { this.contacts.setFiltre(this.cf.value, this.txt) }
  },

  data () {
    return {
      cf: 1,
      optfiltre: [{ label: this.$t('contient'), value: 1 }, { label: this.$t('debute'), value: 2 } ],
      tri: 1,
      opttri: [{ label: this.$t('asc'), value: 1 }, { label: this.$t('desc'), value: 2 } ],
      txt: ''
    }
  },

  methods: {
  },

  setup () {
    const contacts = stores.listeContacts
    const session = stores.session
    const ui = stores.ui

    let cbDem = false // true si le calculBase a été demandé
    watch(contacts, (ap, av) => {
      if (cbDem || !ap.modifs) return // pas modifié OU une demande de calcul est en cours
      cbDem = true; setTimeout(() => { ap.calculBase(); cbDem = false }, 10)
    })

    contacts.calculBase()
    return {
      contacts,
      session,
      ui,
      lst: computed(() => { return contacts.liste }),
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
.q-toolbar
  min-height: 0 !important
.filler
  height: 2rem
.cv
  border-top: 1px solid grey-5
  border-bottom: 1px solid grey-5

::v-deep(.q-field__bottom)
  font-size: 0.7rem
  color: $warning
  font-style: italic
  bottom: 5px !important
::v-deep(.q-field__native)
  font-size: 0.7rem
  font-family: "Roboto Mono"
  color: white !important
::v-deep(.q-field--dark .q-field__native)
  color: white !important
::v-deep(.q-field__control)
  height: inherit

</style>
