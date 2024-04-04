<template>
  <div class="q-pa-xs fs-md full-width">
    <div class="full-width row items-start titre-md text-italic bg-secondary text-white text-bold">
      <div class="col-4">{{$t('RScav')}}</div>
      <div class="col-2 text-center">{{$t('RScno')}}</div>
      <div class="col-2 text-center">{{$t('RScch')}}</div>
      <div class="col-2 text-center">{{$t('RScsp')}}</div>
      <div class="col-2 text-center">{{$t('RSctk')}}</div>
    </div>
    <div style="width:100%;max-height:20vh;overflow:scroll-y">
      <div v-for="([id, item], idx) in aSt.map" :key="id" 
        :class="'row items-start titre-md q-py-xs' + dkli(idx)">
        <div class="col-4">{{nom(id)}}</div>
        <div class="col-2 font-mono text-center">{{item.notes.size}}</div>
        <div class="col-2 font-mono text-center">{{item.chats.size}}</div>
        <div class="col-2 font-mono text-center">{{item.sponsorings.size}}</div>
        <div class="col-2 font-mono text-center">{{item.tickets.size}}</div>
      </div>
    </div>
    <div class="full-width row items-start titre-md text-italic bg-secondary text-white text-bold">
      <div class="col-4">{{$t('RScgr')}}</div>
      <div class="col-2 text-center">{{$t('RScno')}}</div>
      <div class="col-2 text-center">{{$t('RScmb')}}</div>
      <div class="col-2 text-center">{{$t('RScbl')}}</div>
      <div class="col-2 text-center">{{$t('RScbl')}}</div>
    </div>
    <div style="width:100%;max-height:20vh;overflow:scroll-y">
      <div v-for="([id, item], idx) in gSt.map" :key="id" 
        :class="'row items-start titre-md q-py-xs' + dkli(idx)">
        <div class="col-4">{{nom(id)}}</div>
        <div class="col-2 font-mono text-center">{{item.notes.size}}</div>
        <div class="col-2 font-mono text-center">{{item.membres.size}}</div>
        <div class="col-2 font-mono text-center"></div>
        <div class="col-2 font-mono text-center"></div>
      </div>
    </div>
  </div>
</template>

<script>
import stores from '../stores/stores.mjs'
import { dkli } from '../app/util.mjs'

export default ({
  name: 'RapportSynchro',

  props: { },

  computed: {
  },

  methods: {
    nom (id) { return this.session.getCV(id).nom }
  },

  setup () {
    return {
      session: stores.session,
      aSt: stores.avatar,
      gSt: stores.groupe,
      dkli
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
