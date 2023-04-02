<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div class="col-auto items-center q-mr-sm">
        <img class="photomax" :src="eg.groupe.photo || photoDef" />
      </div>
      <div class="col">
        <div>
          <span class="text-bold fs-md q-mr-sm">{{eg.groupe.na.nomc}}</span> 
          <span class="text-bold fs-sm font-mono q-mr-sm">#{{eg.groupe.na.id}}</span> 
        </div>
        <show-html v-if="info" class="q-my-xs bord" :idx="idx" zoom maxh="4rem" :texte="eg.groupe.info"/>
        <div v-else class="text-italic">{{$t('PGnocv')}}</div>
        <q-btn v-if="edit" class="q-my-xs" flat size="sm" :label="$t('CVedit')" 
          icon="edit" dense color="primary" @click="edit('cv', eg.groupe)"/>
        <div class="q-mt-sm">

        </div>
        <apercu-membreac v-for="m in eg.mbac" :key="m.na.id" class="q-mt-sm" :idg="m.id" :im="m.ids"/>
      </div>
    </div>

  </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuMembreac from './ApercuMembreac.vue'

export default {
  name: 'ApercuGroupe',

  props: { eg: Object, idx: Number, edit: Function },

  components: { ApercuMembreac },

  computed: {
  },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe
    const photoDef = stores.config.iconGroupe
    return {
      session,
      photoDef,
      gSt
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
